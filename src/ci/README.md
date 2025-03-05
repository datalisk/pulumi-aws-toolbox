# Ideas

new Website({
  artifact: factory.chain([
    factory.useExistingFrom({
      bucket: "dev-main-frontend-artifacts",
    }),
    factory.onCondition(isDev, factory.buildWithCodeBuild({
      instanceType: "t3.medium",
      image: buildImage({ // TODO buildImage will be a similar chained factory based ECR
        image: "nodejs:22",
        src: "builders/frontend", // image must include awscli
        // docker context is the entire repo - includes frontend/package.json
      }),
      src: "frontend",
      command: "npm run build",
      outDir: "build", // takes output from build/ dir by default
    })),
  ]).toOutput()
})

