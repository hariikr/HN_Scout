import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="A creative Hacker News explorer with quality scoring and pagination" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}