import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {


  webpack: (config, { webpack }) => {
    config.plugins.push(

      new webpack.IgnorePlugin({
        resourceRegExp: /^(react-native|react-native-fs|react-native-fetch-blob)$/,
      })
    );
    return config;
  },
};

export default withPWA(nextConfig);
