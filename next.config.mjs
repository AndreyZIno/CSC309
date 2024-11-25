import withTM from 'next-transpile-modules';

const nextConfig = withTM(['react-syntax-highlighter'])({
  reactStrictMode: true,
});

export default nextConfig;
