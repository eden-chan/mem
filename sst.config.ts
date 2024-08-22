/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "mem",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    const bucket = new sst.aws.Bucket("MyBucket", {
      public: true,
      cors: {
        allowOrigins: ["*", "http://localhost:3000"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "HEAD"],
        // allowHeaders: ["Content-Type", "Authorization"],
        allowHeaders: ["*"],
        exposeHeaders: ["ETag"],
        maxAge: "3000 seconds",
      },
    });

    new sst.aws.SolidStart("MyWeb", {
      link: [bucket],
    });
  },
});
