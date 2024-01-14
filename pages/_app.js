import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return (
  <>
  <Component {...pageProps} />
  <style jsx global>{`
  body {
    background: ${true ? "#1a202c" : "antiquewhite"};
  }
`}</style>
  </> )
}

export default MyApp
