export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  gcs: {
    bucket: 'louis-public-bucket',
  },
});
