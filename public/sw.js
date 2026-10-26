/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-5d155c7a'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "screenshot-mobile.png",
    "revision": "a4c98c471e0c4adb33cabcfa08ac540b"
  }, {
    "url": "screenshot-desktop.png",
    "revision": "db3363f8c1c32060b3a11c9574dee6cd"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "eff6dee5915776d2b9314997def1a599"
  }, {
    "url": "pwa-512x512.png",
    "revision": "e039accf10658ca5014358d014faa196"
  }, {
    "url": "pwa-192x192.png",
    "revision": "02fe34bf7f411681451fd98fcce8c000"
  }, {
    "url": "manifest.json",
    "revision": "d5fb625c6c67659d2f2fc01f016f541f"
  }, {
    "url": "index.html",
    "revision": "1db128d4bf8b6b24a3bf5b1be5c4ba5b"
  }, {
    "url": "icon.svg",
    "revision": "006fcb7857f6f83b861769464b38c96c"
  }, {
    "url": "favicon.png",
    "revision": "17414c65844d825b98b599c4435700d2"
  }, {
    "url": "favicon.ico",
    "revision": "1f17f2d02a30e5bc17f9d746a2eb1eaa"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "039a4e228dc19c38f7705f7a7eaee7d6"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/index-D2qV9K9x.css",
    "revision": null
  }, {
    "url": "assets/index-AkIIMQfa.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "039a4e228dc19c38f7705f7a7eaee7d6"
  }, {
    "url": "favicon.ico",
    "revision": "1f17f2d02a30e5bc17f9d746a2eb1eaa"
  }, {
    "url": "favicon.png",
    "revision": "17414c65844d825b98b599c4435700d2"
  }, {
    "url": "icon.svg",
    "revision": "006fcb7857f6f83b861769464b38c96c"
  }, {
    "url": "pwa-192x192.png",
    "revision": "02fe34bf7f411681451fd98fcce8c000"
  }, {
    "url": "pwa-512x512.png",
    "revision": "e039accf10658ca5014358d014faa196"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "eff6dee5915776d2b9314997def1a599"
  }, {
    "url": "screenshot-desktop.png",
    "revision": "db3363f8c1c32060b3a11c9574dee6cd"
  }, {
    "url": "screenshot-mobile.png",
    "revision": "a4c98c471e0c4adb33cabcfa08ac540b"
  }, {
    "url": "manifest.webmanifest",
    "revision": "d2dceec88f564791b07eadc01d808ea7"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/\/api\/dictionary.*/i, new workbox.NetworkFirst({
    "cacheName": "api-dictionary-cache",
    "networkTimeoutSeconds": 3,
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 604800
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
