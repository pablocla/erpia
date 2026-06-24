import React from "react"
import ReactDOMServer from "react-dom/server"
import { ClavERPProductHub } from "../components/marketing/claverp-product-hub"

console.log("Imported successfully!")
try {
  const html = ReactDOMServer.renderToString(React.createElement(ClavERPProductHub))
  console.log("Rendered successfully! Length:", html.length)
} catch (e) {
  console.error("Error during rendering:", e)
}
