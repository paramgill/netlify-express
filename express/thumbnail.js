/* Copyright 2017 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const Canvas = require("canvas");
const assert = require("assert").strict;
const fs = require("fs");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

function NodeCanvasFactory() {}
NodeCanvasFactory.prototype = {
  create: function NodeCanvasFactory_create(width, height) {
    assert(width > 0 && height > 0, "Invalid canvas size");
    const canvas = Canvas.createCanvas(width, height);
    const context = canvas.getContext("2d");
    return {
      canvas,
      context,
    };
  },

  reset: function NodeCanvasFactory_reset(canvasAndContext, width, height) {
    assert(canvasAndContext.canvas, "Canvas is not specified");
    assert(width > 0 && height > 0, "Invalid canvas size");
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  },

  destroy: function NodeCanvasFactory_destroy(canvasAndContext) {
    assert(canvasAndContext.canvas, "Canvas is not specified");

    // Zeroing the width and height cause Firefox to release graphics
    // resources immediately, which can greatly reduce memory consumption.
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  },
};

const canvasFactory = new NodeCanvasFactory();

module.exports.generateThumbnail = async (request, response) => {
  console.log("in generateThumbnail");
  try {
    // Load the PDF file.
    const loadingTask = pdfjsLib.getDocument({
      url: "https://www.datocms-assets.com/96396/1681279476-cityswitch-establish-your-baseline-scope-1-and-2.pdf",
      canvasFactory,
    });
    let result = { result: "done" };

    const pdfDocument = await loadingTask.promise;
    const page = await pdfDocument.getPage(1);
    // Render the page on a Node canvas with 100% scale.
    const viewport = page.getViewport({ scale: 1.0 });
    const canvasAndContext = canvasFactory.create(
      viewport.width,
      viewport.height
    );
    const renderContext = {
      canvasContext: canvasAndContext.context,
      viewport,
    };

    const renderTask = page.render(renderContext);
    await renderTask.promise;
    // Convert the canvas to an image buffer.
    const image = canvasAndContext.canvas.toBuffer();
    fs.writeFile("thumbnail.png", image, function (error) {
      if (error) {
        result = { result: error };
      } else {
        result = {
          result: "success",
        };
      }
      page.cleanup();
      return response
        .set("Cache-Control", "public, max-age=3600, s-maxage=10800")
        .status(200)
        .json(result);
    });
    // Release page resources.
  } catch (err) {
    response.status(404).send(err);
  }
};
