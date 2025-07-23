"use strict";

var _axios = _interopRequireDefault(require("axios"));

var _dotenv = _interopRequireDefault(require("dotenv"));

var _express = _interopRequireDefault(require("express"));

var _cors = _interopRequireDefault(require("cors"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

_dotenv["default"].config();

var OPENAI_API_KEY = process.env.OPENAI_API_KEY;
var app = (0, _express["default"])();
var PORT = process.env.PORT || 3001;
app.use((0, _cors["default"])());
app.use(_express["default"].json({
  limit: "2mb"
}));

function getStructuredScenes(script) {
  var prompt, response;
  return regeneratorRuntime.async(function getStructuredScenes$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          prompt = "\nYou are a helpful assistant that splits a given script into 10 scenes for a video. \nFor each scene, extract the main keyword and write a concise script for that scene.\nReturn the result as a JSON array with the following structure:\n\n[\n  {\n    \"scene\": 1,\n    \"script\": \"...\",\n    \"main_keyword\": \"...\"\n  },\n  ...\n  {\n    \"scene\": 10,\n    \"script\": \"...\",\n    \"main_keyword\": \"...\"\n  }\n]\n\nScript:\n\"\"\"".concat(script, "\"\"\"\n");
          _context.next = 3;
          return regeneratorRuntime.awrap(_axios["default"].post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o",
            messages: [{
              role: "system",
              content: "You are a helpful assistant."
            }, {
              role: "user",
              content: prompt
            }],
            response_format: {
              type: "json_object"
            }
          }, {
            headers: {
              Authorization: "Bearer ".concat(OPENAI_API_KEY),
              "Content-Type": "application/json"
            }
          }));

        case 3:
          response = _context.sent;
          return _context.abrupt("return", JSON.parse(response.data.choices[0].message.content));

        case 5:
        case "end":
          return _context.stop();
      }
    }
  });
}

function generateImage(prompt) {
  var response;
  return regeneratorRuntime.async(function generateImage$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return regeneratorRuntime.awrap(_axios["default"].post("https://api.openai.com/v1/images/generations", {
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024"
          }, {
            headers: {
              Authorization: "Bearer ".concat(OPENAI_API_KEY),
              "Content-Type": "application/json"
            }
          }));

        case 2:
          response = _context2.sent;
          return _context2.abrupt("return", response.data.data[0].url);

        case 4:
        case "end":
          return _context2.stop();
      }
    }
  });
} // 1. 대본 → 씬 10개 분할


app.post("/api/scenes", function _callee(req, res) {
  var script, scenes;
  return regeneratorRuntime.async(function _callee$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          script = req.body.script;

          if (script) {
            _context3.next = 3;
            break;
          }

          return _context3.abrupt("return", res.status(400).json({
            error: "script is required"
          }));

        case 3:
          _context3.prev = 3;
          _context3.next = 6;
          return regeneratorRuntime.awrap(getStructuredScenes(script));

        case 6:
          scenes = _context3.sent;
          res.json({
            scenes: scenes
          });
          _context3.next = 13;
          break;

        case 10:
          _context3.prev = 10;
          _context3.t0 = _context3["catch"](3);
          res.status(500).json({
            error: _context3.t0.message
          });

        case 13:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[3, 10]]);
}); // 2. 씬별 main_keyword → 이미지 생성

app.post("/api/images", function _callee2(req, res) {
  var scenes, results, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, scene, imagePrompt, image_url;

  return regeneratorRuntime.async(function _callee2$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          scenes = req.body.scenes;

          if (!(!scenes || !Array.isArray(scenes))) {
            _context4.next = 3;
            break;
          }

          return _context4.abrupt("return", res.status(400).json({
            error: "scenes array is required"
          }));

        case 3:
          _context4.prev = 3;
          results = [];
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context4.prev = 8;
          _iterator = scenes[Symbol.iterator]();

        case 10:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context4.next = 20;
            break;
          }

          scene = _step.value;
          imagePrompt = "Create an image that represents the following keyword in the context of the script: \"".concat(scene.main_keyword, "\"");
          _context4.next = 15;
          return regeneratorRuntime.awrap(generateImage(imagePrompt));

        case 15:
          image_url = _context4.sent;
          results.push(_objectSpread({}, scene, {
            image_url: image_url
          }));

        case 17:
          _iteratorNormalCompletion = true;
          _context4.next = 10;
          break;

        case 20:
          _context4.next = 26;
          break;

        case 22:
          _context4.prev = 22;
          _context4.t0 = _context4["catch"](8);
          _didIteratorError = true;
          _iteratorError = _context4.t0;

        case 26:
          _context4.prev = 26;
          _context4.prev = 27;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 29:
          _context4.prev = 29;

          if (!_didIteratorError) {
            _context4.next = 32;
            break;
          }

          throw _iteratorError;

        case 32:
          return _context4.finish(29);

        case 33:
          return _context4.finish(26);

        case 34:
          res.json({
            scenes: results
          });
          _context4.next = 40;
          break;

        case 37:
          _context4.prev = 37;
          _context4.t1 = _context4["catch"](3);
          res.status(500).json({
            error: _context4.t1.message
          });

        case 40:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[3, 37], [8, 22, 26, 34], [27,, 29, 33]]);
});
app.listen(PORT, function () {
  console.log("Server listening on port ".concat(PORT));
});