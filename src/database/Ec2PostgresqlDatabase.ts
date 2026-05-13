import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { createHostDnsRecords } from "../dns/dns";
import { ConnectDetails } from "./ConnectDetails";

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
export class Ec2PostgresqlDatabase extends pulumi.ComponentResource {
    private readonly args: Ec2PostgresqlDatabaseArgs;
    private readonly instance: aws.ec2.Instance;

    constructor(name: string, args: Ec2PostgresqlDatabaseArgs, opts?: pulumi.ComponentResourceOptions) {
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
            protect: opts?.protect,
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
            userData: createInitScript(volumePath, args.password),
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

        createHostDnsRecords(name, args.domain, this.instance.privateIp, this.instance.ipv6Addresses[0], 30, { parent: this, protect: false });
    }

    getConnectDetails(): ConnectDetails {
        return {
            type: "postgresql",
            host: pulumi.output(this.args.domain),
            port: 5432,
            name: "postgres",
            username: "postgres",
            password: pulumi.output(this.args.password),
        };
    }

    getInstanceId(): pulumi.Output<string> {
        return this.instance.id;
    }

    private createInstanceProfile(name: string) {
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

export interface Ec2PostgresqlDatabaseArgs {
    /**
     * Size of the data volume in GB.
     */
    dataVolumeSize: pulumi.Input<number>;

    domain: pulumi.Input<string>;
    instanceType: aws.types.enums.ec2.InstanceType,
    password: pulumi.Input<string>;
    securityGroupId: pulumi.Input<string>;
    subnet: aws.ec2.Subnet;
}

// see setup guide https://docs.fedoraproject.org/en-US/quick-docs/postgresql/
export const createInitScript = (volume: string, password: pulumi.Input<string>) => pulumi.interpolate`#!/bin/bash
pwd
cat /etc/os-release

echo ====== Wait for ${volume} to be attached
while [ ! -e ${volume} ]; do sleep 1; done
echo ====== Wait for ${volume} done

if [[ -z $(blkid ${volume}) ]]; then
    echo ====== Initialize fresh volume
    mkfs -t ext4 ${volume}

    ${createMountpoint(volume, "/var/lib/pgsql")}

    ${installPostgresql()}

    ${setupPostgresql()}
else
    ${createMountpoint(volume, "/var/lib/pgsql")}

    ${installPostgresql()}
fi

echo ====== Starting postgresql
systemctl enable postgresql
systemctl start postgresql

echo ====== Setting admin password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '${password}'"
systemctl restart postgresql

echo ====== Init script completed
`;

export const createMountpoint = (volume: string, mountPoint: string) => `
echo Mounting ${volume} to ${mountPoint}
mkdir -p ${mountPoint}
echo "${volume} ${mountPoint} ext4 defaults,nofail 0 2" >> /etc/fstab
mount -a
`;

export const installPostgresql = () => `
echo ====== Installing postgresql
dnf install -y postgresql15-server postgresql15-contrib
`;

export const setupPostgresql = () => `
echo ====== Postgres setup
postgresql-setup --initdb
printf "local all all peer\nhost all all all md5" > /var/lib/pgsql/data/pg_hba.conf
echo "listen_addresses = '*'" >> /var/lib/pgsql/data/postgresql.conf
`;
