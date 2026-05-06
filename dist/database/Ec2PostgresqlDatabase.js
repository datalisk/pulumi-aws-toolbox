"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPostgresql = exports.installPostgresql = exports.createMountpoint = exports.createInitScript = exports.Ec2PostgresqlDatabase = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const dns_1 = require("../dns/dns");
/**
 * Creates a self-hosted postgresql database on EC2.
 *
 * Features:
 *  - we can use very cheap instances, like t4g.nano
 *  - using custom server configuration/extension is possible
 *
 * Not suitable for production with high availability and durability requirements.
 *
 * Changing data volume size is not supported and would lead to data loss!
 */
class Ec2PostgresqlDatabase extends pulumi.ComponentResource {
    constructor(name, args, opts) {
        super("pat:database:Ec2PostgresqlDatabase", name, args, opts);
        this.args = args;
        const dataVolume = new aws.ebs.Volume(`${name}-data`, {
            availabilityZone: args.subnet.availabilityZone,
            encrypted: true,
            size: args.dataVolumeSize,
            type: "gp3",
            tags: {
                Name: `${name}-data`,
            },
        }, {
            parent: this,
            protect: opts === null || opts === void 0 ? void 0 : opts.protect,
            replaceOnChanges: ["*"], // forces replace on size change, which fails if protected
        });
        const ami = pulumi.output(aws.ec2.getAmi({
            owners: ["amazon"],
            mostRecent: true,
            filters: [
                { name: "name", values: ["al2023-ami-2023.*"] },
                { name: "architecture", values: ["arm64"] },
            ],
        }));
        const volumePath = "/dev/xvdf";
        this.instance = new aws.ec2.Instance(`${name}`, {
            ami: ami.id,
            instanceType: args.instanceType,
            iamInstanceProfile: this.createInstanceProfile(name),
            subnetId: args.subnet.id,
            vpcSecurityGroupIds: [args.securityGroupId],
            userData: (0, exports.createInitScript)(volumePath, args.password),
            tags: {
                Name: `${name}`,
            },
        }, {
            parent: this,
            protect: false,
            replaceOnChanges: ["*"], // forces replacement on userData change,
        });
        new aws.ec2.VolumeAttachment(`${name}-data`, {
            instanceId: this.instance.id,
            volumeId: dataVolume.id,
            deviceName: volumePath,
            stopInstanceBeforeDetaching: true,
        }, {
            parent: this,
            protect: false,
            deleteBeforeReplace: true,
        });
        (0, dns_1.createHostDnsRecords)(name, args.domain, this.instance.privateIp, this.instance.ipv6Addresses[0], 30, { parent: this, protect: false });
    }
    getConnectDetails() {
        return {
            type: "postgresql",
            host: pulumi.output(this.args.domain),
            port: 5432,
            name: "postgres",
            username: "postgres",
            password: pulumi.output(this.args.password),
        };
    }
    getInstanceId() {
        return this.instance.id;
    }
    createInstanceProfile(name) {
        const role = new aws.iam.Role(name, {
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                        Effect: "Allow",
                        Action: "sts:AssumeRole",
                        Principal: {
                            Service: "ec2.amazonaws.com"
                        }
                    }]
            })
        }, { parent: this });
        return new aws.iam.InstanceProfile(name, {
            role: role.name
        }, { parent: this });
    }
}
exports.Ec2PostgresqlDatabase = Ec2PostgresqlDatabase;
// see setup guide https://docs.fedoraproject.org/en-US/quick-docs/postgresql/
const createInitScript = (volume, password) => pulumi.interpolate `#!/bin/bash
pwd
cat /etc/os-release

echo ====== Wait for ${volume} to be attached
while [ ! -e ${volume} ]; do sleep 1; done
echo ====== Wait for ${volume} done

if [[ -z $(blkid ${volume}) ]]; then
    echo ====== Initialize fresh volume
    mkfs -t ext4 ${volume}

    ${(0, exports.createMountpoint)(volume, "/var/lib/pgsql")}

    ${(0, exports.installPostgresql)()}

    ${(0, exports.setupPostgresql)()}
else
    ${(0, exports.createMountpoint)(volume, "/var/lib/pgsql")}

    ${(0, exports.installPostgresql)()}
fi

echo ====== Starting postgresql
systemctl enable postgresql
systemctl start postgresql

echo ====== Setting admin password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '${password}'"
systemctl restart postgresql

echo ====== Init script completed
`;
exports.createInitScript = createInitScript;
const createMountpoint = (volume, mountPoint) => `
echo Mounting ${volume} to ${mountPoint}
mkdir -p ${mountPoint}
echo "${volume} ${mountPoint} ext4 defaults,nofail 0 2" >> /etc/fstab
mount -a
`;
exports.createMountpoint = createMountpoint;
const installPostgresql = () => `
echo ====== Installing postgresql
dnf install -y postgresql15-server postgresql15-contrib
`;
exports.installPostgresql = installPostgresql;
const setupPostgresql = () => `
echo ====== Postgres setup
postgresql-setup --initdb
printf "local all all peer\nhost all all all md5" > /var/lib/pgsql/data/pg_hba.conf
echo "listen_addresses = '*'" >> /var/lib/pgsql/data/postgresql.conf
`;
exports.setupPostgresql = setupPostgresql;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRWMyUG9zdGdyZXNxbERhdGFiYXNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2RhdGFiYXNlL0VjMlBvc3RncmVzcWxEYXRhYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBeUM7QUFDekMsb0NBQWtEO0FBR2xEOzs7Ozs7Ozs7O0dBVUc7QUFDSCxNQUFhLHFCQUFzQixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFJL0QsWUFBWSxJQUFZLEVBQUUsSUFBK0IsRUFBRSxJQUFzQztRQUM3RixLQUFLLENBQUMsb0NBQW9DLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM5RCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUVqQixNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxPQUFPLEVBQUU7WUFDbEQsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0I7WUFDOUMsU0FBUyxFQUFFLElBQUk7WUFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLGNBQWM7WUFDekIsSUFBSSxFQUFFLEtBQUs7WUFDWCxJQUFJLEVBQUU7Z0JBQ0YsSUFBSSxFQUFFLEdBQUcsSUFBSSxPQUFPO2FBQ3ZCO1NBQ0osRUFBRTtZQUNDLE1BQU0sRUFBRSxJQUFJO1lBQ1osT0FBTyxFQUFFLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxPQUFPO1lBQ3RCLGdCQUFnQixFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsMERBQTBEO1NBQ3RGLENBQUMsQ0FBQztRQUVILE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7WUFDckMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDO1lBQ2xCLFVB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dWx1bWkvYXdzXCI7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSBcIkBwdWx1bWkvcHVsdW1pXCI7XG5pbXBvcnQgeyBjcmVhdGVIb3N0RG5zUmVjb3JkcyB9IGZyb20gXCIuLi9kbnMvZG5zXCI7XG5pbXBvcnQgeyBDb25uZWN0RGV0YWlscyB9IGZyb20gXCIuL0Nvbm5lY3REZXRhaWxzXCI7XG5cbi8qKlxuICogQ3JlYXRlcyBhIHNlbGYtaG9zdGVkIHBvc3RncmVzcWwgZGF0YWJhc2Ugb24gRUMyLlxuICogXG4gKiBGZWF0dXJlczpcbiAqICAtIHdlIGNhbiB1c2UgdmVyeSBjaGVhcCBpbnN0YW5jZXMsIGxpa2UgdDRnLm5hbm9cbiAqICAtIHVzaW5nIGN1c3RvbSBzZXJ2ZXIgY29uZmlndXJhdGlvbi9leHRlbnNpb24gaXMgcG9zc2libGVcbiAqIFxuICogTm90IHN1aXRhYmxlIGZvciBwcm9kdWN0aW9uIHdpdGggaGlnaCBhdmFpbGFiaWxpdHkgYW5kIGR1cmFiaWxpdHkgcmVxdWlyZW1lbnRzLlxuICogXG4gKiBDaGFuZ2luZyBkYXRhIHZvbHVtZSBzaXplIGlzIG5vdCBzdXBwb3J0ZWQgYW5kIHdvdWxkIGxlYWQgdG8gZGF0YSBsb3NzIVxuICovXG5leHBvcnQgY2xhc3MgRWMyUG9zdGdyZXNxbERhdGFiYXNlIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGFyZ3M6IEVjMlBvc3RncmVzcWxEYXRhYmFzZUFyZ3M7XG4gICAgcHJpdmF0ZSByZWFkb25seSBpbnN0YW5jZTogYXdzLmVjMi5JbnN0YW5jZTtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogRWMyUG9zdGdyZXNxbERhdGFiYXNlQXJncywgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJwYXQ6ZGF0YWJhc2U6RWMyUG9zdGdyZXNxbERhdGFiYXNlXCIsIG5hbWUsIGFyZ3MsIG9wdHMpO1xuICAgICAgICB0aGlzLmFyZ3MgPSBhcmdzO1xuXG4gICAgICAgIGNvbnN0IGRhdGFWb2x1bWUgPSBuZXcgYXdzLmVicy5Wb2x1bWUoYCR7bmFtZX0tZGF0YWAsIHtcbiAgICAgICAgICAgIGF2YWlsYWJpbGl0eVpvbmU6IGFyZ3Muc3VibmV0LmF2YWlsYWJpbGl0eVpvbmUsXG4gICAgICAgICAgICBlbmNyeXB0ZWQ6IHRydWUsXG4gICAgICAgICAgICBzaXplOiBhcmdzLmRhdGFWb2x1bWVTaXplLFxuICAgICAgICAgICAgdHlwZTogXCJncDNcIixcbiAgICAgICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAgICAgICBOYW1lOiBgJHtuYW1lfS1kYXRhYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHBhcmVudDogdGhpcyxcbiAgICAgICAgICAgIHByb3RlY3Q6IG9wdHM/LnByb3RlY3QsXG4gICAgICAgICAgICByZXBsYWNlT25DaGFuZ2VzOiBbXCIqXCJdLCAvLyBmb3JjZXMgcmVwbGFjZSBvbiBzaXplIGNoYW5nZSwgd2hpY2ggZmFpbHMgaWYgcHJvdGVjdGVkXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGFtaSA9IHB1bHVtaS5vdXRwdXQoYXdzLmVjMi5nZXRBbWkoe1xuICAgICAgICAgICAgb3duZXJzOiBbXCJhbWF6b25cIl0sXG4gICAgICAgICAgICBtb3N0UmVjZW50OiB0cnVlLFxuICAgICAgICAgICAgZmlsdGVyczogW1xuICAgICAgICAgICAgICAgIHsgbmFtZTogXCJuYW1lXCIsIHZhbHVlczogW1wiYWwyMDIzLWFtaS0yMDIzLipcIl0gfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6IFwiYXJjaGl0ZWN0dXJlXCIsIHZhbHVlczogW1wiYXJtNjRcIl0gfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0pKTtcblxuICAgICAgICBjb25zdCB2b2x1bWVQYXRoID0gXCIvZGV2L3h2ZGZcIjtcblxuICAgICAgICB0aGlzLmluc3RhbmNlID0gbmV3IGF3cy5lYzIuSW5zdGFuY2UoYCR7bmFtZX1gLCB7XG4gICAgICAgICAgICBhbWk6IGFtaS5pZCxcbiAgICAgICAgICAgIGluc3RhbmNlVHlwZTogYXJncy5pbnN0YW5jZVR5cGUsXG4gICAgICAgICAgICBpYW1JbnN0YW5jZVByb2ZpbGU6IHRoaXMuY3JlYXRlSW5zdGFuY2VQcm9maWxlKG5hbWUpLFxuICAgICAgICAgICAgc3VibmV0SWQ6IGFyZ3Muc3VibmV0LmlkLFxuICAgICAgICAgICAgdnBjU2VjdXJpdHlHcm91cElkczogW2FyZ3Muc2VjdXJpdHlHcm91cElkXSxcbiAgICAgICAgICAgIHVzZXJEYXRhOiBjcmVhdGVJbml0U2NyaXB0KHZvbHVtZVBhdGgsIGFyZ3MucGFzc3dvcmQpLFxuICAgICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgICAgIE5hbWU6IGAke25hbWV9YCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHBhcmVudDogdGhpcyxcbiAgICAgICAgICAgIHByb3RlY3Q6IGZhbHNlLFxuICAgICAgICAgICAgcmVwbGFjZU9uQ2hhbmdlczogW1wiKlwiXSwgLy8gZm9yY2VzIHJlcGxhY2VtZW50IG9uIHVzZXJEYXRhIGNoYW5nZSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbmV3IGF3cy5lYzIuVm9sdW1lQXR0YWNobWVudChgJHtuYW1lfS1kYXRhYCwge1xuICAgICAgICAgICAgaW5zdGFuY2VJZDogdGhpcy5pbnN0YW5jZS5pZCxcbiAgICAgICAgICAgIHZvbHVtZUlkOiBkYXRhVm9sdW1lLmlkLFxuICAgICAgICAgICAgZGV2aWNlTmFtZTogdm9sdW1lUGF0aCxcbiAgICAgICAgICAgIHN0b3BJbnN0YW5jZUJlZm9yZURldGFjaGluZzogdHJ1ZSxcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgcGFyZW50OiB0aGlzLFxuICAgICAgICAgICAgcHJvdGVjdDogZmFsc2UsXG4gICAgICAgICAgICBkZWxldGVCZWZvcmVSZXBsYWNlOiB0cnVlLFxuICAgICAgICB9KTtcblxuICAgICAgICBjcmVhdGVIb3N0RG5zUmVjb3JkcyhuYW1lLCBhcmdzLmRvbWFpbiwgdGhpcy5pbnN0YW5jZS5wcml2YXRlSXAsIHRoaXMuaW5zdGFuY2UuaXB2NkFkZHJlc3Nlc1swXSwgMzAsIHsgcGFyZW50OiB0aGlzLCBwcm90ZWN0OiBmYWxzZSB9KTtcbiAgICB9XG5cbiAgICBnZXRDb25uZWN0RGV0YWlscygpOiBDb25uZWN0RGV0YWlscyB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBcInBvc3RncmVzcWxcIixcbiAgICAgICAgICAgIGhvc3Q6IHB1bHVtaS5vdXRwdXQodGhpcy5hcmdzLmRvbWFpbiksXG4gICAgICAgICAgICBwb3J0OiA1NDMyLFxuICAgICAgICAgICAgbmFtZTogXCJwb3N0Z3Jlc1wiLFxuICAgICAgICAgICAgdXNlcm5hbWU6IFwicG9zdGdyZXNcIixcbiAgICAgICAgICAgIHBhc3N3b3JkOiBwdWx1bWkub3V0cHV0KHRoaXMuYXJncy5wYXNzd29yZCksXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZ2V0SW5zdGFuY2VJZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5zdGFuY2UuaWQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjcmVhdGVJbnN0YW5jZVByb2ZpbGUobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IHJvbGUgPSBuZXcgYXdzLmlhbS5Sb2xlKG5hbWUsIHtcbiAgICAgICAgICAgIGFzc3VtZVJvbGVQb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICBWZXJzaW9uOiBcIjIwMTItMTAtMTdcIixcbiAgICAgICAgICAgICAgICBTdGF0ZW1lbnQ6IFt7XG4gICAgICAgICAgICAgICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxuICAgICAgICAgICAgICAgICAgICBBY3Rpb246IFwic3RzOkFzc3VtZVJvbGVcIixcbiAgICAgICAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTZXJ2aWNlOiBcImVjMi5hbWF6b25hd3MuY29tXCJcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICB9KVxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICByZXR1cm4gbmV3IGF3cy5pYW0uSW5zdGFuY2VQcm9maWxlKG5hbWUsIHtcbiAgICAgICAgICAgIHJvbGU6IHJvbGUubmFtZVxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcbiAgICB9XG5cbn1cblxuZXhwb3J0IGludGVyZmFjZSBFYzJQb3N0Z3Jlc3FsRGF0YWJhc2VBcmdzIHtcbiAgICAvKipcbiAgICAgKiBTaXplIG9mIHRoZSBkYXRhIHZvbHVtZSBpbiBHQi5cbiAgICAgKi9cbiAgICBkYXRhVm9sdW1lU2l6ZTogcHVsdW1pLklucHV0PG51bWJlcj47XG5cbiAgICBkb21haW46IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIGluc3RhbmNlVHlwZTogYXdzLnR5cGVzLmVudW1zLmVjMi5JbnN0YW5jZVR5cGUsXG4gICAgcGFzc3dvcmQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHNlY3VyaXR5R3JvdXBJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgc3VibmV0OiBhd3MuZWMyLlN1Ym5ldDtcbn1cblxuLy8gc2VlIHNldHVwIGd1aWRlIGh0dHBzOi8vZG9jcy5mZWRvcmFwcm9qZWN0Lm9yZy9lbi1VUy9xdWljay1kb2NzL3Bvc3RncmVzcWwvXG5leHBvcnQgY29uc3QgY3JlYXRlSW5pdFNjcmlwdCA9ICh2b2x1bWU6IHN0cmluZywgcGFzc3dvcmQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+KSA9PiBwdWx1bWkuaW50ZXJwb2xhdGVgIyEvYmluL2Jhc2hcbnB3ZFxuY2F0IC9ldGMvb3MtcmVsZWFzZVxuXG5lY2hvID09PT09PSBXYWl0IGZvciAke3ZvbHVtZX0gdG8gYmUgYXR0YWNoZWRcbndoaWxlIFsgISAtZSAke3ZvbHVtZX0gXTsgZG8gc2xlZXAgMTsgZG9uZVxuZWNobyA9PT09PT0gV2FpdCBmb3IgJHt2b2x1bWV9IGRvbmVcblxuaWYgW1sgLXogJChibGtpZCAke3ZvbHVtZX0pIF1dOyB0aGVuXG4gICAgZWNobyA9PT09PT0gSW5pdGlhbGl6ZSBmcmVzaCB2b2x1bWVcbiAgICBta2ZzIC10IGV4dDQgJHt2b2x1bWV9XG5cbiAgICAke2NyZWF0ZU1vdW50cG9pbnQodm9sdW1lLCBcIi92YXIvbGliL3Bnc3FsXCIpfVxuXG4gICAgJHtpbnN0YWxsUG9zdGdyZXNxbCgpfVxuXG4gICAgJHtzZXR1cFBvc3RncmVzcWwoKX1cbmVsc2VcbiAgICAke2NyZWF0ZU1vdW50cG9pbnQodm9sdW1lLCBcIi92YXIvbGliL3Bnc3FsXCIpfVxuXG4gICAgJHtpbnN0YWxsUG9zdGdyZXNxbCgpfVxuZmlcblxuZWNobyA9PT09PT0gU3RhcnRpbmcgcG9zdGdyZXNxbFxuc3lzdGVtY3RsIGVuYWJsZSBwb3N0Z3Jlc3FsXG5zeXN0ZW1jdGwgc3RhcnQgcG9zdGdyZXNxbFxuXG5lY2hvID09PT09PSBTZXR0aW5nIGFkbWluIHBhc3N3b3JkXG5zdWRvIC11IHBvc3RncmVzIHBzcWwgLWMgXCJBTFRFUiBVU0VSIHBvc3RncmVzIFBBU1NXT1JEICcke3Bhc3N3b3JkfSdcIlxuc3lzdGVtY3RsIHJlc3RhcnQgcG9zdGdyZXNxbFxuXG5lY2hvID09PT09PSBJbml0IHNjcmlwdCBjb21wbGV0ZWRcbmA7XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVNb3VudHBvaW50ID0gKHZvbHVtZTogc3RyaW5nLCBtb3VudFBvaW50OiBzdHJpbmcpID0+IGBcbmVjaG8gTW91bnRpbmcgJHt2b2x1bWV9IHRvICR7bW91bnRQb2ludH1cbm1rZGlyIC1wICR7bW91bnRQb2ludH1cbmVjaG8gXCIke3ZvbHVtZX0gJHttb3VudFBvaW50fSBleHQ0IGRlZmF1bHRzLG5vZmFpbCAwIDJcIiA+PiAvZXRjL2ZzdGFiXG5tb3VudCAtYVxuYDtcblxuZXhwb3J0IGNvbnN0IGluc3RhbGxQb3N0Z3Jlc3FsID0gKCkgPT4gYFxuZWNobyA9PT09PT0gSW5zdGFsbGluZyBwb3N0Z3Jlc3FsXG5kbmYgaW5zdGFsbCAteSBwb3N0Z3Jlc3FsMTUtc2VydmVyIHBvc3RncmVzcWwxNS1jb250cmliXG5gO1xuXG5leHBvcnQgY29uc3Qgc2V0dXBQb3N0Z3Jlc3FsID0gKCkgPT4gYFxuZWNobyA9PT09PT0gUG9zdGdyZXMgc2V0dXBcbnBvc3RncmVzcWwtc2V0dXAgLS1pbml0ZGJcbnByaW50ZiBcImxvY2FsIGFsbCBhbGwgcGVlclxcbmhvc3QgYWxsIGFsbCBhbGwgbWQ1XCIgPiAvdmFyL2xpYi9wZ3NxbC9kYXRhL3BnX2hiYS5jb25mXG5lY2hvIFwibGlzdGVuX2FkZHJlc3NlcyA9ICcqJ1wiID4+IC92YXIvbGliL3Bnc3FsL2RhdGEvcG9zdGdyZXNxbC5jb25mXG5gO1xuIl19