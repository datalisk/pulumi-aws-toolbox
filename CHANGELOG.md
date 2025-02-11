# Changelog

## [1.6.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v1.5.0...v1.6.0) (2025-02-11)


### Features

* StaticWebsite supports setting responseHeadersPolicyId on s3 routes. deprecates the 'immutable' property. ([d5148f7](https://github.com/datalisk/pulumi-aws-toolbox/commit/d5148f73e7fd6af369a3e9dde627b37f0e11ffbe))

## [1.5.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v1.4.2...v1.5.0) (2025-01-23)


### Features

* website ViewerRequestFunction supports setting up redirects ([413cdfa](https://github.com/datalisk/pulumi-aws-toolbox/commit/413cdfafb724bd1257e66ca1b6f755860e015e02))

## [1.4.2](https://github.com/datalisk/pulumi-aws-toolbox/compare/v1.4.1...v1.4.2) (2024-12-19)


### Bug Fixes

* StaticWebsite workaround for CloudFront issue when previously locations were configured ([cbc4d0e](https://github.com/datalisk/pulumi-aws-toolbox/commit/cbc4d0efa3814ca5ff861f1329a384c423f8b531))

## [1.4.1](https://github.com/datalisk/pulumi-aws-toolbox/compare/v1.4.0...v1.4.1) (2024-12-17)


### Bug Fixes

* CloudfrontLogBucket honors retainOnDelete option now ([0ee1779](https://github.com/datalisk/pulumi-aws-toolbox/commit/0ee1779bfb0445b3417b421bade7950041cc2021))
* StaticWebsite poluting global scope ([3280706](https://github.com/datalisk/pulumi-aws-toolbox/commit/3280706fe8c7f0e076f5c70df1322dc2b9a79ee3))

## [1.4.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v1.3.0...v1.4.0) (2024-11-29)


### Features

* Provided a demo app (examples/notebook-app). ([657b87b](https://github.com/datalisk/pulumi-aws-toolbox/commit/657b87bb083029110f23fa47ce9df7331bbb0e35))

## [1.3.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v1.2.1...v1.3.0) (2024-11-28)


### Features

* added rewritePathElement feature to ViewerRequestFunction component ([d3b3753](https://github.com/datalisk/pulumi-aws-toolbox/commit/d3b37534a4be2f6063dd2bacbeb26f7ce8bc6819))
* StaticWebsite is using non-trailing slashes by default now. To keep the previous behavior set "trailingSlash: true" on S3 routes. ([609c248](https://github.com/datalisk/pulumi-aws-toolbox/commit/609c248db45c10d9422c9f678c30e7f652b68b57))
* StaticWebsite S3 route supports configuring a origin cache policy ([7c97e81](https://github.com/datalisk/pulumi-aws-toolbox/commit/7c97e81486c83f10de47c8b4306c22243c5ab887))
* ViewerRequestFunction supports rewriting webpage path for a file strategy now. ([67aebeb](https://github.com/datalisk/pulumi-aws-toolbox/commit/67aebeb8c4931a1c1748971bd15d757e0658174d))

## [1.2.1](https://github.com/datalisk/pulumi-aws-toolbox/compare/v1.2.0...v1.2.1) (2024-10-10)


### Bug Fixes

* StaticWebsite, fixed incorrect parent for new ResponseHeadersPolicy resources ([f2a57f8](https://github.com/datalisk/pulumi-aws-toolbox/commit/f2a57f8638bd960266187192f67a1233dd76eb62))

## [1.2.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v1.1.0...v1.2.0) (2024-10-08)


### Features

* StaticWebsite returning more relaxed referrer-policy header and removed x-frame-options header ([9c088aa](https://github.com/datalisk/pulumi-aws-toolbox/commit/9c088aa42f4e602dc1f1ad4b3366bb6744253adf))

## [1.1.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v1.0.0...v1.1.0) (2024-10-04)


### Features

* StaticWebsite supporting Custom RouteType to serve content from classic server apps. added aliases for easier migration of existing websites ([e8f69a7](https://github.com/datalisk/pulumi-aws-toolbox/commit/e8f69a7e4f6ee30a17ef9fbe4b8d5448d2fb437a))

## [1.0.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.17.3...v1.0.0) (2024-09-30)


### Miscellaneous Chores

* release 1.0.0 ([fef0c39](https://github.com/datalisk/pulumi-aws-toolbox/commit/fef0c39a7dc06c87df585a8979484c025f27ff38))

## [0.17.3](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.17.2...v0.17.3) (2024-09-30)


### Bug Fixes

* calling pat.init is no longer needed ([c08ce7a](https://github.com/datalisk/pulumi-aws-toolbox/commit/c08ce7a5bfb52e7363e36228db19766d57b6c5a6))

## [0.17.2](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.17.1...v0.17.2) (2024-09-12)


### Bug Fixes

* S3ArtifactStore using BucketV2 correctly ([a1ef3de](https://github.com/datalisk/pulumi-aws-toolbox/commit/a1ef3de9bd0deb75bd5a7b5468891e6e4244d39a))

## [0.17.1](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.17.0...v0.17.1) (2024-09-10)


### Bug Fixes

* added workaround for CloudFront/Lambda integration (useOriginAccessControl) ([76a16bf](https://github.com/datalisk/pulumi-aws-toolbox/commit/76a16bf7fc04250a5db8e3c97ed0bb26587ea756))

## [0.17.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.16.7...v0.17.0) (2024-09-10)


### Features

* StaticWebsite supports integrating Lambda functions. changed API of StaticWebsite ([81ec91a](https://github.com/datalisk/pulumi-aws-toolbox/commit/81ec91a4c8aef190f83aceaf8d0369a8bb5ea7e2))

## [0.16.7](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.16.6...v0.16.7) (2024-07-31)


### Bug Fixes

* CloudfrontLogBucket fails to delete due to content ([8144f22](https://github.com/datalisk/pulumi-aws-toolbox/commit/8144f2242d5f8da95e1c99847ae57a77ccd97934))

## [0.16.6](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.16.5...v0.16.6) (2024-07-30)


### Bug Fixes

* delayedOutput skipping delay during preview phase ([90c35d3](https://github.com/datalisk/pulumi-aws-toolbox/commit/90c35d38b20404c1e716558e734f3b4e904ab510))

## [0.16.5](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.16.4...v0.16.5) (2024-07-30)


### Bug Fixes

* added 20s delay to CloudfrontLogBucket to work around around 'bucket does not enable ACL access' errors ([4c2e988](https://github.com/datalisk/pulumi-aws-toolbox/commit/4c2e9880f4ca91c010bbc3d1bcb6e48af906dc71))
* StaticWebsite no longer waiting for full deployment, use delayedOutput instead ([b086678](https://github.com/datalisk/pulumi-aws-toolbox/commit/b0866782c3ac4d0ebd00f875af761450bb14c71c))
* StaticWebsite supporting http3 ([5029e57](https://github.com/datalisk/pulumi-aws-toolbox/commit/5029e57aa78bf0166bf00c8b2f3e0a4f3ff07e3d))

## [0.16.4](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.16.3...v0.16.4) (2024-07-25)


### Bug Fixes

* CloudfrontLogBucket dependency on ACL ([191c039](https://github.com/datalisk/pulumi-aws-toolbox/commit/191c039cae2e6ba4fc3bfe5013fdf10fb23b05ee))

## [0.16.3](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.16.2...v0.16.3) (2024-07-20)


### Bug Fixes

* ec2-postgresql-connect installing correctly ([05d53d9](https://github.com/datalisk/pulumi-aws-toolbox/commit/05d53d9042394d33f142899ed98f78d6c6b837b8))

## [0.16.2](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.16.1...v0.16.2) (2024-07-20)


### Bug Fixes

* Ec2PostgresqlDatabase exposing a domain ([eb2be89](https://github.com/datalisk/pulumi-aws-toolbox/commit/eb2be89cb87d3582087f1921abbd2a911a4935c4))
* getSsmSecret returning a secure Output instead of Promise ([e222e6d](https://github.com/datalisk/pulumi-aws-toolbox/commit/e222e6dfc4c0ab5fc87ae6e601212c1628cf4e9f))

## [0.16.1](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.16.0...v0.16.1) (2024-07-16)


### Bug Fixes

* getVersion supporting multiple paths ([a210e64](https://github.com/datalisk/pulumi-aws-toolbox/commit/a210e64e315dfa06302a6a4988c6621c188cbc67))

## [0.16.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.15.1...v0.16.0) (2024-07-16)


### Features

* added getVersion to build immutable artifacts ([dfe3d75](https://github.com/datalisk/pulumi-aws-toolbox/commit/dfe3d75898273b28f1a83b22c52ae0fe0993812f))
* mailer supporting different region, fixed missing IAM permission ([d96b98d](https://github.com/datalisk/pulumi-aws-toolbox/commit/d96b98da0ff8342fdd899c6d46f1e2c26465bcc1))

## [0.15.1](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.15.0...v0.15.1) (2024-07-15)


### Bug Fixes

* aws login failing gracefully ([4651eca](https://github.com/datalisk/pulumi-aws-toolbox/commit/4651eca14d0ec75903de14969e8c193784bb573b))

## [0.15.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.14.1...v0.15.0) (2024-07-15)


### Features

* added Ec2PostgresqlDatabase ([b546177](https://github.com/datalisk/pulumi-aws-toolbox/commit/b546177329f542178324ef1ce65a3138b80ee0f6))
* renamed pulumi-s3-login to pulumi-aws-login ([f3c54fa](https://github.com/datalisk/pulumi-aws-toolbox/commit/f3c54fa32b2069dee6e6886e198902bd6793976c))
* Vpc support for IPAM pools ([168477e](https://github.com/datalisk/pulumi-aws-toolbox/commit/168477e8e59283fa814a3b289d9008e5d2c9bb14))

## [0.14.1](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.14.0...v0.14.1) (2024-07-12)


### Bug Fixes

* enabled sending security headers for StaticWebsite by default ([e749796](https://github.com/datalisk/pulumi-aws-toolbox/commit/e749796ba58be423467d43d6fa100bc0513c3f1b))

## [0.14.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.13.1...v0.14.0) (2024-07-12)


### Features

* added setting website security headers, fixed handler chain logic ([4bc460b](https://github.com/datalisk/pulumi-aws-toolbox/commit/4bc460ba40b51e456c64b485ef7d8428b781cb8a))

## [0.13.1](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.13.0...v0.13.1) (2024-07-11)


### Bug Fixes

* lambda Builder creating resources for wrong parent ([a7d94e9](https://github.com/datalisk/pulumi-aws-toolbox/commit/a7d94e9b4c7da204c34cf632dbea666d606ade41))

## [0.13.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.12.0...v0.13.0) (2024-07-10)


### Features

* StaticWebsite storing access logs ([3aeda59](https://github.com/datalisk/pulumi-aws-toolbox/commit/3aeda594752aee0fa820ec398877444477e88906))


### Bug Fixes

* corrected parent of cloudfront log bucket ([db74999](https://github.com/datalisk/pulumi-aws-toolbox/commit/db749993d082741e32ba5af9c712a65a71dd6880))

## [0.12.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.11.0...v0.12.0) (2024-07-05)


### Features

* changed pulumi state bucket name ([5d8c559](https://github.com/datalisk/pulumi-aws-toolbox/commit/5d8c559d36d25166c51ac417cc19a4db27d4ec62))

## [0.11.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.10.3...v0.11.0) (2024-07-02)


### Features

* cleaned up S3Artifact api ([c871923](https://github.com/datalisk/pulumi-aws-toolbox/commit/c871923a4a394405688f3a1379f564dcb3a1e2ce))
* replaced BaseLambda with Builder ([35ec83b](https://github.com/datalisk/pulumi-aws-toolbox/commit/35ec83beaefd24521f7ed6edd5e050a573156967))

## [0.10.3](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.10.2...v0.10.3) (2024-06-29)


### Bug Fixes

* BaseLambda policies not being removed correctly ([32e3496](https://github.com/datalisk/pulumi-aws-toolbox/commit/32e3496118d2c5c6a16724a35258dd24ee5115c4))

## [0.10.2](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.10.1...v0.10.2) (2024-06-29)


### Bug Fixes

* SimpleNodeLambda didn't add policies. change BaseLambda API ([47ee752](https://github.com/datalisk/pulumi-aws-toolbox/commit/47ee752af40ee111f84fb4bc4d4fd8c8746cb925))

## [0.10.1](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.10.0...v0.10.1) (2024-06-29)


### Bug Fixes

* BaseLambda optional type parameter ([b0c14ca](https://github.com/datalisk/pulumi-aws-toolbox/commit/b0c14cab77861b623347dd150ebcdafaf57120b1))

## [0.10.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.9.4...v0.10.0) (2024-06-29)


### Features

* S3Artifact api change, added getS3ArtifactForBucket, better docs ([e6e5762](https://github.com/datalisk/pulumi-aws-toolbox/commit/e6e57628c3bee809001901cf0e01a2209d2f99fe))

## [0.9.4](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.9.3...v0.9.4) (2024-06-28)


### Bug Fixes

* added missing export ([290827d](https://github.com/datalisk/pulumi-aws-toolbox/commit/290827d209882c33a596cc6db0c847a67580bb9c))

## [0.9.3](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.9.2...v0.9.3) (2024-06-28)


### Bug Fixes

* lambda not using correct log group ([69eb0b5](https://github.com/datalisk/pulumi-aws-toolbox/commit/69eb0b5e4ab4275ef16fb8ccb047d2fa7e4d7ad3))

## [0.9.2](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.9.1...v0.9.2) (2024-06-24)


### Bug Fixes

* added memorySize, timeout to SimpleNodeLambda ([aada2ad](https://github.com/datalisk/pulumi-aws-toolbox/commit/aada2ad0232f583bd01389f91fbb4840c8c5a943))

## [0.9.1](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.9.0...v0.9.1) (2024-06-18)


### Bug Fixes

* SimpleNodeLambda using arm64 arch by default ([9e6b52d](https://github.com/datalisk/pulumi-aws-toolbox/commit/9e6b52d2830f21ff647f1ec2f674fd4d2aa8a253))

## [0.9.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.8.0...v0.9.0) (2024-06-17)


### Features

* SimpleNodeLambda vpc support ([bfbe010](https://github.com/datalisk/pulumi-aws-toolbox/commit/bfbe01064c17e999adeed5854c19c3cc03ee85ca))

## [0.8.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.7.0...v0.8.0) (2024-06-17)


### Features

* added SimpleNodeLambda, more docs ([066738d](https://github.com/datalisk/pulumi-aws-toolbox/commit/066738dbbd986daf56f62655709fbaa07ef7a50c))

## [0.7.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.6.0...v0.7.0) (2024-06-07)


### Features

* integration of single assets ([f41ec09](https://github.com/datalisk/pulumi-aws-toolbox/commit/f41ec0994995c982959523a3ec64d3ee79c835a2))


### Bug Fixes

* correctly expiring artifacts ([1ce68a4](https://github.com/datalisk/pulumi-aws-toolbox/commit/1ce68a4c4c1d423daa8b48d0c994532bef9f0448))

## [0.6.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.5.0...v0.6.0) (2024-06-07)


### ⚠ BREAKING CHANGES

* grouped components into packages
* introduced S3ArtifactStore. StaticWebsite is no longer implicitly creating a bucket

### Features

* introduced S3ArtifactStore. StaticWebsite is no longer implicitly creating a bucket ([9380002](https://github.com/datalisk/pulumi-aws-toolbox/commit/938000291a18ef34d203bfaba81358d2a01fee0b))


### Miscellaneous Chores

* grouped components into packages ([78a8443](https://github.com/datalisk/pulumi-aws-toolbox/commit/78a84430eb23f161b053ec418d08673d2589bd97))

## [0.5.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.4.1...v0.5.0) (2024-06-06)


### Features

* added SesProxyMailer ([f21343d](https://github.com/datalisk/pulumi-aws-toolbox/commit/f21343d2f82fcebd47fbb9cc053551585bc048cd))


### Bug Fixes

* Vpc public subnet cidr collision ([b83a790](https://github.com/datalisk/pulumi-aws-toolbox/commit/b83a79060ef18f698ac33d6e091030db73a77ed3))

## [0.4.1](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.4.0...v0.4.1) (2024-06-06)


### Bug Fixes

* installing pulumi-s3-login as executable ([f34cfda](https://github.com/datalisk/pulumi-aws-toolbox/commit/f34cfdaf56aa272e37035501400c3fe453011243))

## [0.4.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.3.0...v0.4.0) (2024-06-06)


### Features

* pulumi-s3-login script ([f6161b6](https://github.com/datalisk/pulumi-aws-toolbox/commit/f6161b67f8f1433ddb4cf042a1da68ac9b31efd6))

## [0.3.0](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.2.3...v0.3.0) (2024-06-03)


### Features

* introduced Vpc and Website components ([b51798b](https://github.com/datalisk/pulumi-aws-toolbox/commit/b51798bb827fa9cfd3e2ed990cfb3d5d4ac22cc2))

## [0.2.3](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.2.2...v0.2.3) (2024-06-02)


### Bug Fixes

* missing code in release ([f411724](https://github.com/datalisk/pulumi-aws-toolbox/commit/f4117244efc24ce75c0f46e03d0c8e65f14a9989))

## [0.2.2](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.2.1...v0.2.2) (2024-06-02)


### Bug Fixes

* missing repo url ([3ecf16c](https://github.com/datalisk/pulumi-aws-toolbox/commit/3ecf16c1c5cb59dab7b463e0e93a2c0a5ce16297))

## [0.2.1](https://github.com/datalisk/pulumi-aws-toolbox/compare/v0.2.0...v0.2.1) (2024-06-02)


### Bug Fixes

* missing github permission ([9dfdab7](https://github.com/datalisk/pulumi-aws-toolbox/commit/9dfdab7a826ff5f8c4c60abc44889b4aaaef280b))

## 0.2.0 (2024-06-02)


### Features

* npm publish ([b75431f](https://github.com/datalisk/pulumi-aws-toolbox/commit/b75431f26527dd3d1093e7ab9e8de7026293ca1b))
* release-please integration ([a835a6d](https://github.com/datalisk/pulumi-aws-toolbox/commit/a835a6d2fb303f6ad3b26686ba87fdaec1cb8a4c))
* ssm getSecret function, basic project setup ([da4c534](https://github.com/datalisk/pulumi-aws-toolbox/commit/da4c534ecbb1dedbd2bee4abb0a1248ec4e32083))
