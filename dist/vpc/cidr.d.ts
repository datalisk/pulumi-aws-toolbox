/**
 * Returns a IPv6 CIDR for a subnet with 64-bit prefix length contained in the given networkCidr.
 * The subnetIndex can be used to create multiple such subnets that won't overlap.
 * @param networkCidr valid IPv6 CIDR
 * @param subnetIndex must be >= 0
 * @returns the IPv6 CIDR of the subnet
 */
export declare function computeSubnetIpv6Cidr(networkCidr: string, subnetIndex: number): string;
