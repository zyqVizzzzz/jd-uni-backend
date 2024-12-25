export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  wechat: {
    appId: process.env.WECHAT_APP_ID,
    appSecret: process.env.WECHAT_APP_SECRET,
  },
  COS_SECRET_ID: process.env.COS_SECRET_ID,
  COS_SECRET_KEY: process.env.COS_SECRET_KEY,
  COS_BUCKET: process.env.COS_BUCKET,
  COS_REGION: process.env.COS_REGION,
});
