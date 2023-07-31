if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global2 = uni.requireGlobal();
  ArrayBuffer = global2.ArrayBuffer;
  Int8Array = global2.Int8Array;
  Uint8Array = global2.Uint8Array;
  Uint8ClampedArray = global2.Uint8ClampedArray;
  Int16Array = global2.Int16Array;
  Uint16Array = global2.Uint16Array;
  Int32Array = global2.Int32Array;
  Uint32Array = global2.Uint32Array;
  Float32Array = global2.Float32Array;
  Float64Array = global2.Float64Array;
  BigInt64Array = global2.BigInt64Array;
  BigUint64Array = global2.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue, shared) {
  "use strict";
  function getTarget() {
    if (typeof window !== "undefined") {
      return window;
    }
    if (typeof globalThis !== "undefined") {
      return globalThis;
    }
    if (typeof global !== "undefined") {
      return global;
    }
    if (typeof my !== "undefined") {
      return my;
    }
  }
  class Socket {
    constructor(host) {
      this.sid = "";
      this.ackTimeout = 5e3;
      this.closed = false;
      this._ackTimer = 0;
      this._onCallbacks = {};
      this.host = host;
      setTimeout(() => {
        this.connect();
      }, 50);
    }
    connect() {
      this._socket = uni.connectSocket({
        url: `ws://${this.host}/socket.io/?EIO=4&transport=websocket`,
        multiple: true,
        complete(res) {
        }
      });
      this._socket.onOpen((res) => {
      });
      this._socket.onMessage(({ data }) => {
        if (typeof my !== "undefined") {
          data = data.data;
        }
        if (typeof data !== "string") {
          return;
        }
        if (data[0] === "0") {
          this._send("40");
          const res = JSON.parse(data.slice(1));
          this.sid = res.sid;
        } else if (data[0] + data[1] === "40") {
          this.sid = JSON.parse(data.slice(2)).sid;
          this._trigger("connect");
        } else if (data === "3") {
          this._send("2");
        } else if (data === "2") {
          this._send("3");
        } else {
          const match = /\[.*\]/.exec(data);
          if (!match)
            return;
          try {
            const [event, args] = JSON.parse(match[0]);
            this._trigger(event, args);
          } catch (err) {
            console.error("Vue DevTools onMessage: ", err);
          }
        }
      });
      this._socket.onClose((res) => {
        this.closed = true;
        this._trigger("disconnect", res);
      });
      this._socket.onError((res) => {
        console.error(res.errMsg);
      });
    }
    on(event, callback) {
      (this._onCallbacks[event] || (this._onCallbacks[event] = [])).push(callback);
    }
    emit(event, data) {
      if (this.closed) {
        return;
      }
      this._heartbeat();
      this._send(`42${JSON.stringify(typeof data !== "undefined" ? [event, data] : [event])}`);
    }
    disconnect() {
      clearTimeout(this._ackTimer);
      if (this._socket && !this.closed) {
        this._send("41");
        this._socket.close({});
      }
    }
    _heartbeat() {
      clearTimeout(this._ackTimer);
      this._ackTimer = setTimeout(() => {
        this._socket && this._socket.send({ data: "3" });
      }, this.ackTimeout);
    }
    _send(data) {
      this._socket && this._socket.send({ data });
    }
    _trigger(event, args) {
      const callbacks = this._onCallbacks[event];
      if (callbacks) {
        callbacks.forEach((callback) => {
          callback(args);
        });
      }
    }
  }
  let socketReadyCallback;
  getTarget().__VUE_DEVTOOLS_ON_SOCKET_READY__ = (callback) => {
    socketReadyCallback = callback;
  };
  let targetHost = "";
  const hosts = "192.168.1.236".split(",");
  setTimeout(() => {
    uni.request({
      url: `http://${"localhost"}:${9502}`,
      timeout: 1e3,
      success() {
        targetHost = "localhost";
        initSocket();
      },
      fail() {
        if (!targetHost && hosts.length) {
          hosts.forEach((host) => {
            uni.request({
              url: `http://${host}:${9502}`,
              timeout: 1e3,
              success() {
                if (!targetHost) {
                  targetHost = host;
                  initSocket();
                }
              }
            });
          });
        }
      }
    });
  }, 0);
  throwConnectionError();
  function throwConnectionError() {
    setTimeout(() => {
      if (!targetHost) {
        throw new Error("未能获取局域网地址，本地调试服务不可用");
      }
    }, (hosts.length + 1) * 1100);
  }
  function initSocket() {
    getTarget().__VUE_DEVTOOLS_SOCKET__ = new Socket(targetHost + ":8100");
    socketReadyCallback();
  }
  var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  (function() {
    var __webpack_modules__ = {
      /***/
      "../app-backend-core/lib/hook.js": (
        /*!***************************************!*\
          !*** ../app-backend-core/lib/hook.js ***!
          \***************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.installHook = void 0;
          function installHook(target, isIframe = false) {
            const devtoolsVersion = "6.0";
            let listeners = {};
            function injectIframeHook(iframe) {
              if (iframe.__vdevtools__injected)
                return;
              try {
                iframe.__vdevtools__injected = true;
                const inject = () => {
                  try {
                    iframe.contentWindow.__VUE_DEVTOOLS_IFRAME__ = iframe;
                    const script = iframe.contentDocument.createElement("script");
                    script.textContent = ";(" + installHook.toString() + ")(window, true)";
                    iframe.contentDocument.documentElement.appendChild(script);
                    script.parentNode.removeChild(script);
                  } catch (e) {
                  }
                };
                inject();
                iframe.addEventListener("load", () => inject());
              } catch (e) {
              }
            }
            let iframeChecks = 0;
            function injectToIframes() {
              if (typeof window === "undefined")
                return;
              const iframes = document.querySelectorAll("iframe:not([data-vue-devtools-ignore])");
              for (const iframe of iframes) {
                injectIframeHook(iframe);
              }
            }
            injectToIframes();
            const iframeTimer = setInterval(() => {
              injectToIframes();
              iframeChecks++;
              if (iframeChecks >= 5) {
                clearInterval(iframeTimer);
              }
            }, 1e3);
            if (Object.prototype.hasOwnProperty.call(target, "__VUE_DEVTOOLS_GLOBAL_HOOK__")) {
              if (target.__VUE_DEVTOOLS_GLOBAL_HOOK__.devtoolsVersion !== devtoolsVersion) {
                console.error(`Another version of Vue Devtools seems to be installed. Please enable only one version at a time.`);
              }
              return;
            }
            let hook;
            if (isIframe) {
              const sendToParent = (cb) => {
                try {
                  const hook2 = window.parent.__VUE_DEVTOOLS_GLOBAL_HOOK__;
                  if (hook2) {
                    return cb(hook2);
                  } else {
                    console.warn("[Vue Devtools] No hook in parent window");
                  }
                } catch (e) {
                  console.warn("[Vue Devtools] Failed to send message to parent window", e);
                }
              };
              hook = {
                devtoolsVersion,
                // eslint-disable-next-line accessor-pairs
                set Vue(value) {
                  sendToParent((hook2) => {
                    hook2.Vue = value;
                  });
                },
                // eslint-disable-next-line accessor-pairs
                set enabled(value) {
                  sendToParent((hook2) => {
                    hook2.enabled = value;
                  });
                },
                on(event, fn) {
                  sendToParent((hook2) => hook2.on(event, fn));
                },
                once(event, fn) {
                  sendToParent((hook2) => hook2.once(event, fn));
                },
                off(event, fn) {
                  sendToParent((hook2) => hook2.off(event, fn));
                },
                emit(event, ...args) {
                  sendToParent((hook2) => hook2.emit(event, ...args));
                },
                cleanupBuffer(matchArg) {
                  var _a;
                  return (_a = sendToParent((hook2) => hook2.cleanupBuffer(matchArg))) !== null && _a !== void 0 ? _a : false;
                }
              };
            } else {
              hook = {
                devtoolsVersion,
                Vue: null,
                enabled: void 0,
                _buffer: [],
                store: null,
                initialState: null,
                storeModules: null,
                flushStoreModules: null,
                apps: [],
                _replayBuffer(event) {
                  const buffer = this._buffer;
                  this._buffer = [];
                  for (let i2 = 0, l2 = buffer.length; i2 < l2; i2++) {
                    const allArgs = buffer[i2];
                    allArgs[0] === event ? this.emit.apply(this, allArgs) : this._buffer.push(allArgs);
                  }
                },
                on(event, fn) {
                  const $event = "$" + event;
                  if (listeners[$event]) {
                    listeners[$event].push(fn);
                  } else {
                    listeners[$event] = [fn];
                    this._replayBuffer(event);
                  }
                },
                once(event, fn) {
                  const on = (...args) => {
                    this.off(event, on);
                    return fn.apply(this, args);
                  };
                  this.on(event, on);
                },
                off(event, fn) {
                  event = "$" + event;
                  if (!arguments.length) {
                    listeners = {};
                  } else {
                    const cbs = listeners[event];
                    if (cbs) {
                      if (!fn) {
                        listeners[event] = null;
                      } else {
                        for (let i2 = 0, l2 = cbs.length; i2 < l2; i2++) {
                          const cb = cbs[i2];
                          if (cb === fn || cb.fn === fn) {
                            cbs.splice(i2, 1);
                            break;
                          }
                        }
                      }
                    }
                  }
                },
                emit(event, ...args) {
                  const $event = "$" + event;
                  let cbs = listeners[$event];
                  if (cbs) {
                    cbs = cbs.slice();
                    for (let i2 = 0, l2 = cbs.length; i2 < l2; i2++) {
                      try {
                        const result = cbs[i2].apply(this, args);
                        if (typeof (result === null || result === void 0 ? void 0 : result.catch) === "function") {
                          result.catch((e) => {
                            console.error(`[Hook] Error in async event handler for ${event} with args:`, args);
                            console.error(e);
                          });
                        }
                      } catch (e) {
                        console.error(`[Hook] Error in event handler for ${event} with args:`, args);
                        console.error(e);
                      }
                    }
                  } else {
                    this._buffer.push([event, ...args]);
                  }
                },
                /**
                 * Remove buffered events with any argument that is equal to the given value.
                 * @param matchArg Given value to match.
                 */
                cleanupBuffer(matchArg) {
                  let wasBuffered = false;
                  this._buffer = this._buffer.filter((item) => {
                    if (item.some((arg) => arg === matchArg)) {
                      wasBuffered = true;
                      return false;
                    }
                    return true;
                  });
                  return wasBuffered;
                }
              };
              hook.once("init", (Vue2) => {
                hook.Vue = Vue2;
                if (Vue2) {
                  Vue2.prototype.$inspect = function() {
                    const fn = target.__VUE_DEVTOOLS_INSPECT__;
                    fn && fn(this);
                  };
                }
              });
              hook.on("app:init", (app, version2, types) => {
                const appRecord = {
                  app,
                  version: version2,
                  types
                };
                hook.apps.push(appRecord);
                hook.emit("app:add", appRecord);
              });
              hook.once("vuex:init", (store) => {
                hook.store = store;
                hook.initialState = clone2(store.state);
                const origReplaceState = store.replaceState.bind(store);
                store.replaceState = (state) => {
                  hook.initialState = clone2(state);
                  origReplaceState(state);
                };
                let origRegister, origUnregister;
                if (store.registerModule) {
                  hook.storeModules = [];
                  origRegister = store.registerModule.bind(store);
                  store.registerModule = (path, module, options) => {
                    if (typeof path === "string")
                      path = [path];
                    hook.storeModules.push({
                      path,
                      module,
                      options
                    });
                    origRegister(path, module, options);
                    {
                      console.log("early register module", path, module, options);
                    }
                  };
                  origUnregister = store.unregisterModule.bind(store);
                  store.unregisterModule = (path) => {
                    if (typeof path === "string")
                      path = [path];
                    const key = path.join("/");
                    const index2 = hook.storeModules.findIndex((m2) => m2.path.join("/") === key);
                    if (index2 !== -1)
                      hook.storeModules.splice(index2, 1);
                    origUnregister(path);
                    {
                      console.log("early unregister module", path);
                    }
                  };
                }
                hook.flushStoreModules = () => {
                  store.replaceState = origReplaceState;
                  if (store.registerModule) {
                    store.registerModule = origRegister;
                    store.unregisterModule = origUnregister;
                  }
                  return hook.storeModules || [];
                };
              });
            }
            {
              uni.syncDataToGlobal({
                __VUE_DEVTOOLS_GLOBAL_HOOK__: hook
              });
            }
            Object.defineProperty(target, "__VUE_DEVTOOLS_GLOBAL_HOOK__", {
              get() {
                return hook;
              }
            });
            if (target.__VUE_DEVTOOLS_HOOK_REPLAY__) {
              try {
                target.__VUE_DEVTOOLS_HOOK_REPLAY__.forEach((cb) => cb(hook));
                target.__VUE_DEVTOOLS_HOOK_REPLAY__ = [];
              } catch (e) {
                console.error("[vue-devtools] Error during hook replay", e);
              }
            }
            const {
              toString: toStringFunction
            } = Function.prototype;
            const {
              create,
              defineProperty,
              getOwnPropertyDescriptor,
              getOwnPropertyNames,
              getOwnPropertySymbols,
              getPrototypeOf
            } = Object;
            const {
              hasOwnProperty: hasOwnProperty2,
              propertyIsEnumerable
            } = Object.prototype;
            const SUPPORTS = {
              SYMBOL_PROPERTIES: typeof getOwnPropertySymbols === "function",
              WEAKSET: typeof WeakSet === "function"
            };
            const createCache = () => {
              if (SUPPORTS.WEAKSET) {
                return /* @__PURE__ */ new WeakSet();
              }
              const object2 = create({
                add: (value) => object2._values.push(value),
                has: (value) => !!~object2._values.indexOf(value)
              });
              object2._values = [];
              return object2;
            };
            const getCleanClone = (object2, realm) => {
              if (!object2.constructor) {
                return create(null);
              }
              const prototype = object2.__proto__ || getPrototypeOf(object2);
              if (object2.constructor === realm.Object) {
                return prototype === realm.Object.prototype ? {} : create(prototype);
              }
              if (~toStringFunction.call(object2.constructor).indexOf("[native code]")) {
                try {
                  return new object2.constructor();
                } catch (e) {
                }
              }
              return create(prototype);
            };
            const getObjectCloneLoose = (object2, realm, handleCopy, cache) => {
              const clone3 = getCleanClone(object2, realm);
              for (const key in object2) {
                if (hasOwnProperty2.call(object2, key)) {
                  clone3[key] = handleCopy(object2[key], cache);
                }
              }
              if (SUPPORTS.SYMBOL_PROPERTIES) {
                const symbols = getOwnPropertySymbols(object2);
                if (symbols.length) {
                  for (let index2 = 0, symbol; index2 < symbols.length; index2++) {
                    symbol = symbols[index2];
                    if (propertyIsEnumerable.call(object2, symbol)) {
                      clone3[symbol] = handleCopy(object2[symbol], cache);
                    }
                  }
                }
              }
              return clone3;
            };
            const getObjectCloneStrict = (object2, realm, handleCopy, cache) => {
              const clone3 = getCleanClone(object2, realm);
              const properties = SUPPORTS.SYMBOL_PROPERTIES ? [].concat(getOwnPropertyNames(object2), getOwnPropertySymbols(object2)) : getOwnPropertyNames(object2);
              if (properties.length) {
                for (let index2 = 0, property, descriptor; index2 < properties.length; index2++) {
                  property = properties[index2];
                  if (property !== "callee" && property !== "caller") {
                    descriptor = getOwnPropertyDescriptor(object2, property);
                    descriptor.value = handleCopy(object2[property], cache);
                    defineProperty(clone3, property, descriptor);
                  }
                }
              }
              return clone3;
            };
            const getRegExpFlags = (regExp2) => {
              let flags = "";
              if (regExp2.global) {
                flags += "g";
              }
              if (regExp2.ignoreCase) {
                flags += "i";
              }
              if (regExp2.multiline) {
                flags += "m";
              }
              if (regExp2.unicode) {
                flags += "u";
              }
              if (regExp2.sticky) {
                flags += "y";
              }
              return flags;
            };
            const {
              isArray: isArray2
            } = Array;
            const GLOBAL_THIS = (() => {
              if (typeof self !== "undefined") {
                return self;
              }
              if (typeof window !== "undefined") {
                return window;
              }
              if (typeof __webpack_require__2.g !== "undefined") {
                return __webpack_require__2.g;
              }
              if (console && console.error) {
                console.error('Unable to locate global object, returning "this".');
              }
            })();
            function clone2(object2, options = null) {
              const isStrict = !!(options && options.isStrict);
              const realm = options && options.realm || GLOBAL_THIS;
              const getObjectClone = isStrict ? getObjectCloneStrict : getObjectCloneLoose;
              const handleCopy = (object3, cache) => {
                if (!object3 || typeof object3 !== "object" || cache.has(object3)) {
                  return object3;
                }
                if (typeof HTMLElement !== "undefined" && object3 instanceof HTMLElement) {
                  return object3.cloneNode(false);
                }
                const Constructor = object3.constructor;
                if (Constructor === realm.Object) {
                  cache.add(object3);
                  return getObjectClone(object3, realm, handleCopy, cache);
                }
                let clone3;
                if (isArray2(object3)) {
                  cache.add(object3);
                  if (isStrict) {
                    return getObjectCloneStrict(object3, realm, handleCopy, cache);
                  }
                  clone3 = new Constructor();
                  for (let index2 = 0; index2 < object3.length; index2++) {
                    clone3[index2] = handleCopy(object3[index2], cache);
                  }
                  return clone3;
                }
                if (object3 instanceof realm.Date) {
                  return new Constructor(object3.getTime());
                }
                if (object3 instanceof realm.RegExp) {
                  clone3 = new Constructor(object3.source, object3.flags || getRegExpFlags(object3));
                  clone3.lastIndex = object3.lastIndex;
                  return clone3;
                }
                if (realm.Map && object3 instanceof realm.Map) {
                  cache.add(object3);
                  clone3 = new Constructor();
                  object3.forEach((value, key) => {
                    clone3.set(key, handleCopy(value, cache));
                  });
                  return clone3;
                }
                if (realm.Set && object3 instanceof realm.Set) {
                  cache.add(object3);
                  clone3 = new Constructor();
                  object3.forEach((value) => {
                    clone3.add(handleCopy(value, cache));
                  });
                  return clone3;
                }
                if (realm.Buffer && realm.Buffer.isBuffer(object3)) {
                  clone3 = realm.Buffer.allocUnsafe ? realm.Buffer.allocUnsafe(object3.length) : new Constructor(object3.length);
                  object3.copy(clone3);
                  return clone3;
                }
                if (realm.ArrayBuffer) {
                  if (realm.ArrayBuffer.isView(object3)) {
                    return new Constructor(object3.buffer.slice(0));
                  }
                  if (object3 instanceof realm.ArrayBuffer) {
                    return object3.slice(0);
                  }
                }
                if (
                  // promise-like
                  hasOwnProperty2.call(object3, "then") && typeof object3.then === "function" || // errors
                  object3 instanceof Error || // weakmaps
                  realm.WeakMap && object3 instanceof realm.WeakMap || // weaksets
                  realm.WeakSet && object3 instanceof realm.WeakSet
                ) {
                  return object3;
                }
                cache.add(object3);
                return getObjectClone(object3, realm, handleCopy, cache);
              };
              return handleCopy(object2, createCache());
            }
          }
          exports.installHook = installHook;
        }
      ),
      /***/
      "../shared-utils/lib/backend.js": (
        /*!**************************************!*\
          !*** ../shared-utils/lib/backend.js ***!
          \**************************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.getCatchedGetters = exports.getCustomStoreDetails = exports.getCustomRouterDetails = exports.isVueInstance = exports.getCustomObjectDetails = exports.getCustomInstanceDetails = exports.getInstanceMap = exports.backendInjections = void 0;
          exports.backendInjections = {
            instanceMap: /* @__PURE__ */ new Map(),
            isVueInstance: () => false,
            getCustomInstanceDetails: () => ({}),
            getCustomObjectDetails: () => void 0
          };
          function getInstanceMap() {
            return exports.backendInjections.instanceMap;
          }
          exports.getInstanceMap = getInstanceMap;
          function getCustomInstanceDetails(instance) {
            return exports.backendInjections.getCustomInstanceDetails(instance);
          }
          exports.getCustomInstanceDetails = getCustomInstanceDetails;
          function getCustomObjectDetails(value, proto) {
            return exports.backendInjections.getCustomObjectDetails(value, proto);
          }
          exports.getCustomObjectDetails = getCustomObjectDetails;
          function isVueInstance(value) {
            return exports.backendInjections.isVueInstance(value);
          }
          exports.isVueInstance = isVueInstance;
          function getCustomRouterDetails(router) {
            return {
              _custom: {
                type: "router",
                display: "VueRouter",
                value: {
                  options: router.options,
                  currentRoute: router.currentRoute
                },
                fields: {
                  abstract: true
                }
              }
            };
          }
          exports.getCustomRouterDetails = getCustomRouterDetails;
          function getCustomStoreDetails(store) {
            return {
              _custom: {
                type: "store",
                display: "Store",
                value: {
                  state: store.state,
                  getters: getCatchedGetters(store)
                },
                fields: {
                  abstract: true
                }
              }
            };
          }
          exports.getCustomStoreDetails = getCustomStoreDetails;
          function getCatchedGetters(store) {
            const getters = {};
            const origGetters = store.getters || {};
            const keys = Object.keys(origGetters);
            for (let i2 = 0; i2 < keys.length; i2++) {
              const key = keys[i2];
              Object.defineProperty(getters, key, {
                enumerable: true,
                get: () => {
                  try {
                    return origGetters[key];
                  } catch (e) {
                    return e;
                  }
                }
              });
            }
            return getters;
          }
          exports.getCatchedGetters = getCatchedGetters;
        }
      ),
      /***/
      "../shared-utils/lib/bridge.js": (
        /*!*************************************!*\
          !*** ../shared-utils/lib/bridge.js ***!
          \*************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.Bridge = void 0;
          const events_1 = __webpack_require__2(
            /*! events */
            "../../node_modules/events/events.js"
          );
          const raf_1 = __webpack_require__2(
            /*! ./raf */
            "../shared-utils/lib/raf.js"
          );
          const BATCH_DURATION = 100;
          class Bridge extends events_1.EventEmitter {
            constructor(wall) {
              super();
              this.setMaxListeners(Infinity);
              this.wall = wall;
              wall.listen((messages) => {
                if (Array.isArray(messages)) {
                  messages.forEach((message) => this._emit(message));
                } else {
                  this._emit(messages);
                }
              });
              this._batchingQueue = [];
              this._sendingQueue = [];
              this._receivingQueue = [];
              this._sending = false;
            }
            on(event, listener) {
              const wrappedListener = async (...args) => {
                try {
                  await listener(...args);
                } catch (e) {
                  console.error(`[Bridge] Error in listener for event ${event.toString()} with args:`, args);
                  console.error(e);
                }
              };
              return super.on(event, wrappedListener);
            }
            send(event, payload) {
              this._batchingQueue.push({
                event,
                payload
              });
              if (this._timer == null) {
                this._timer = setTimeout(() => this._flush(), BATCH_DURATION);
              }
            }
            /**
             * Log a message to the devtools background page.
             */
            log(message) {
              this.send("log", message);
            }
            _flush() {
              if (this._batchingQueue.length)
                this._send(this._batchingQueue);
              clearTimeout(this._timer);
              this._timer = null;
              this._batchingQueue = [];
            }
            // @TODO types
            _emit(message) {
              if (typeof message === "string") {
                this.emit(message);
              } else if (message._chunk) {
                this._receivingQueue.push(message._chunk);
                if (message.last) {
                  this.emit(message.event, this._receivingQueue);
                  this._receivingQueue = [];
                }
              } else if (message.event) {
                this.emit(message.event, message.payload);
              }
            }
            // @TODO types
            _send(messages) {
              this._sendingQueue.push(messages);
              this._nextSend();
            }
            _nextSend() {
              if (!this._sendingQueue.length || this._sending)
                return;
              this._sending = true;
              const messages = this._sendingQueue.shift();
              try {
                this.wall.send(messages);
              } catch (err) {
                if (err.message === "Message length exceeded maximum allowed length.") {
                  this._sendingQueue.splice(0, 0, messages.map((message) => [message]));
                }
              }
              this._sending = false;
              (0, raf_1.raf)(() => this._nextSend());
            }
          }
          exports.Bridge = Bridge;
        }
      ),
      /***/
      "../shared-utils/lib/consts.js": (
        /*!*************************************!*\
          !*** ../shared-utils/lib/consts.js ***!
          \*************************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.HookEvents = exports.BridgeSubscriptions = exports.BridgeEvents = exports.BuiltinTabs = void 0;
          (function(BuiltinTabs) {
            BuiltinTabs["COMPONENTS"] = "components";
            BuiltinTabs["TIMELINE"] = "timeline";
            BuiltinTabs["PLUGINS"] = "plugins";
            BuiltinTabs["SETTINGS"] = "settings";
          })(exports.BuiltinTabs || (exports.BuiltinTabs = {}));
          (function(BridgeEvents) {
            BridgeEvents["TO_BACK_SUBSCRIBE"] = "b:subscribe";
            BridgeEvents["TO_BACK_UNSUBSCRIBE"] = "b:unsubscribe";
            BridgeEvents["TO_FRONT_READY"] = "f:ready";
            BridgeEvents["TO_BACK_LOG_DETECTED_VUE"] = "b:log-detected-vue";
            BridgeEvents["TO_BACK_REFRESH"] = "b:refresh";
            BridgeEvents["TO_BACK_TAB_SWITCH"] = "b:tab:switch";
            BridgeEvents["TO_BACK_LOG"] = "b:log";
            BridgeEvents["TO_FRONT_RECONNECTED"] = "f:reconnected";
            BridgeEvents["TO_FRONT_TITLE"] = "f:title";
            BridgeEvents["TO_FRONT_APP_ADD"] = "f:app:add";
            BridgeEvents["TO_BACK_APP_LIST"] = "b:app:list";
            BridgeEvents["TO_FRONT_APP_LIST"] = "f:app:list";
            BridgeEvents["TO_FRONT_APP_REMOVE"] = "f:app:remove";
            BridgeEvents["TO_BACK_APP_SELECT"] = "b:app:select";
            BridgeEvents["TO_FRONT_APP_SELECTED"] = "f:app:selected";
            BridgeEvents["TO_BACK_SCAN_LEGACY_APPS"] = "b:app:scan-legacy";
            BridgeEvents["TO_BACK_COMPONENT_TREE"] = "b:component:tree";
            BridgeEvents["TO_FRONT_COMPONENT_TREE"] = "f:component:tree";
            BridgeEvents["TO_BACK_COMPONENT_SELECTED_DATA"] = "b:component:selected-data";
            BridgeEvents["TO_FRONT_COMPONENT_SELECTED_DATA"] = "f:component:selected-data";
            BridgeEvents["TO_BACK_COMPONENT_EXPAND"] = "b:component:expand";
            BridgeEvents["TO_FRONT_COMPONENT_EXPAND"] = "f:component:expand";
            BridgeEvents["TO_BACK_COMPONENT_SCROLL_TO"] = "b:component:scroll-to";
            BridgeEvents["TO_BACK_COMPONENT_FILTER"] = "b:component:filter";
            BridgeEvents["TO_BACK_COMPONENT_MOUSE_OVER"] = "b:component:mouse-over";
            BridgeEvents["TO_BACK_COMPONENT_MOUSE_OUT"] = "b:component:mouse-out";
            BridgeEvents["TO_BACK_COMPONENT_CONTEXT_MENU_TARGET"] = "b:component:context-menu-target";
            BridgeEvents["TO_BACK_COMPONENT_EDIT_STATE"] = "b:component:edit-state";
            BridgeEvents["TO_BACK_COMPONENT_PICK"] = "b:component:pick";
            BridgeEvents["TO_FRONT_COMPONENT_PICK"] = "f:component:pick";
            BridgeEvents["TO_BACK_COMPONENT_PICK_CANCELED"] = "b:component:pick-canceled";
            BridgeEvents["TO_FRONT_COMPONENT_PICK_CANCELED"] = "f:component:pick-canceled";
            BridgeEvents["TO_BACK_COMPONENT_INSPECT_DOM"] = "b:component:inspect-dom";
            BridgeEvents["TO_FRONT_COMPONENT_INSPECT_DOM"] = "f:component:inspect-dom";
            BridgeEvents["TO_BACK_COMPONENT_RENDER_CODE"] = "b:component:render-code";
            BridgeEvents["TO_FRONT_COMPONENT_RENDER_CODE"] = "f:component:render-code";
            BridgeEvents["TO_FRONT_COMPONENT_UPDATED"] = "f:component:updated";
            BridgeEvents["TO_FRONT_TIMELINE_EVENT"] = "f:timeline:event";
            BridgeEvents["TO_BACK_TIMELINE_LAYER_LIST"] = "b:timeline:layer-list";
            BridgeEvents["TO_FRONT_TIMELINE_LAYER_LIST"] = "f:timeline:layer-list";
            BridgeEvents["TO_FRONT_TIMELINE_LAYER_ADD"] = "f:timeline:layer-add";
            BridgeEvents["TO_BACK_TIMELINE_SHOW_SCREENSHOT"] = "b:timeline:show-screenshot";
            BridgeEvents["TO_BACK_TIMELINE_CLEAR"] = "b:timeline:clear";
            BridgeEvents["TO_BACK_TIMELINE_EVENT_DATA"] = "b:timeline:event-data";
            BridgeEvents["TO_FRONT_TIMELINE_EVENT_DATA"] = "f:timeline:event-data";
            BridgeEvents["TO_BACK_TIMELINE_LAYER_LOAD_EVENTS"] = "b:timeline:layer-load-events";
            BridgeEvents["TO_FRONT_TIMELINE_LAYER_LOAD_EVENTS"] = "f:timeline:layer-load-events";
            BridgeEvents["TO_BACK_TIMELINE_LOAD_MARKERS"] = "b:timeline:load-markers";
            BridgeEvents["TO_FRONT_TIMELINE_LOAD_MARKERS"] = "f:timeline:load-markers";
            BridgeEvents["TO_FRONT_TIMELINE_MARKER"] = "f:timeline:marker";
            BridgeEvents["TO_BACK_DEVTOOLS_PLUGIN_LIST"] = "b:devtools-plugin:list";
            BridgeEvents["TO_FRONT_DEVTOOLS_PLUGIN_LIST"] = "f:devtools-plugin:list";
            BridgeEvents["TO_FRONT_DEVTOOLS_PLUGIN_ADD"] = "f:devtools-plugin:add";
            BridgeEvents["TO_BACK_DEVTOOLS_PLUGIN_SETTING_UPDATED"] = "b:devtools-plugin:setting-updated";
            BridgeEvents["TO_BACK_CUSTOM_INSPECTOR_LIST"] = "b:custom-inspector:list";
            BridgeEvents["TO_FRONT_CUSTOM_INSPECTOR_LIST"] = "f:custom-inspector:list";
            BridgeEvents["TO_FRONT_CUSTOM_INSPECTOR_ADD"] = "f:custom-inspector:add";
            BridgeEvents["TO_BACK_CUSTOM_INSPECTOR_TREE"] = "b:custom-inspector:tree";
            BridgeEvents["TO_FRONT_CUSTOM_INSPECTOR_TREE"] = "f:custom-inspector:tree";
            BridgeEvents["TO_BACK_CUSTOM_INSPECTOR_STATE"] = "b:custom-inspector:state";
            BridgeEvents["TO_FRONT_CUSTOM_INSPECTOR_STATE"] = "f:custom-inspector:state";
            BridgeEvents["TO_BACK_CUSTOM_INSPECTOR_EDIT_STATE"] = "b:custom-inspector:edit-state";
            BridgeEvents["TO_BACK_CUSTOM_INSPECTOR_ACTION"] = "b:custom-inspector:action";
            BridgeEvents["TO_BACK_CUSTOM_INSPECTOR_NODE_ACTION"] = "b:custom-inspector:node-action";
            BridgeEvents["TO_FRONT_CUSTOM_INSPECTOR_SELECT_NODE"] = "f:custom-inspector:select-node";
            BridgeEvents["TO_BACK_CUSTOM_STATE_ACTION"] = "b:custom-state:action";
          })(exports.BridgeEvents || (exports.BridgeEvents = {}));
          (function(BridgeSubscriptions) {
            BridgeSubscriptions["SELECTED_COMPONENT_DATA"] = "component:selected-data";
            BridgeSubscriptions["COMPONENT_TREE"] = "component:tree";
          })(exports.BridgeSubscriptions || (exports.BridgeSubscriptions = {}));
          (function(HookEvents) {
            HookEvents["INIT"] = "init";
            HookEvents["APP_INIT"] = "app:init";
            HookEvents["APP_ADD"] = "app:add";
            HookEvents["APP_UNMOUNT"] = "app:unmount";
            HookEvents["COMPONENT_UPDATED"] = "component:updated";
            HookEvents["COMPONENT_ADDED"] = "component:added";
            HookEvents["COMPONENT_REMOVED"] = "component:removed";
            HookEvents["COMPONENT_EMIT"] = "component:emit";
            HookEvents["COMPONENT_HIGHLIGHT"] = "component:highlight";
            HookEvents["COMPONENT_UNHIGHLIGHT"] = "component:unhighlight";
            HookEvents["SETUP_DEVTOOLS_PLUGIN"] = "devtools-plugin:setup";
            HookEvents["TIMELINE_LAYER_ADDED"] = "timeline:layer-added";
            HookEvents["TIMELINE_EVENT_ADDED"] = "timeline:event-added";
            HookEvents["CUSTOM_INSPECTOR_ADD"] = "custom-inspector:add";
            HookEvents["CUSTOM_INSPECTOR_SEND_TREE"] = "custom-inspector:send-tree";
            HookEvents["CUSTOM_INSPECTOR_SEND_STATE"] = "custom-inspector:send-state";
            HookEvents["CUSTOM_INSPECTOR_SELECT_NODE"] = "custom-inspector:select-node";
            HookEvents["PERFORMANCE_START"] = "perf:start";
            HookEvents["PERFORMANCE_END"] = "perf:end";
            HookEvents["PLUGIN_SETTINGS_SET"] = "plugin:settings:set";
            HookEvents["FLUSH"] = "flush";
            HookEvents["TRACK_UPDATE"] = "_track-update";
            HookEvents["FLASH_UPDATE"] = "_flash-update";
          })(exports.HookEvents || (exports.HookEvents = {}));
        }
      ),
      /***/
      "../shared-utils/lib/edit.js": (
        /*!***********************************!*\
          !*** ../shared-utils/lib/edit.js ***!
          \***********************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.StateEditor = void 0;
          class StateEditor {
            set(object2, path, value, cb = null) {
              const sections = Array.isArray(path) ? path : path.split(".");
              while (sections.length > 1) {
                object2 = object2[sections.shift()];
                if (this.isRef(object2)) {
                  object2 = this.getRefValue(object2);
                }
              }
              const field = sections[0];
              if (cb) {
                cb(object2, field, value);
              } else if (this.isRef(object2[field])) {
                this.setRefValue(object2[field], value);
              } else {
                object2[field] = value;
              }
            }
            get(object2, path) {
              const sections = Array.isArray(path) ? path : path.split(".");
              for (let i2 = 0; i2 < sections.length; i2++) {
                object2 = object2[sections[i2]];
                if (this.isRef(object2)) {
                  object2 = this.getRefValue(object2);
                }
                if (!object2) {
                  return void 0;
                }
              }
              return object2;
            }
            has(object2, path, parent = false) {
              if (typeof object2 === "undefined") {
                return false;
              }
              const sections = Array.isArray(path) ? path.slice() : path.split(".");
              const size = !parent ? 1 : 2;
              while (object2 && sections.length > size) {
                object2 = object2[sections.shift()];
                if (this.isRef(object2)) {
                  object2 = this.getRefValue(object2);
                }
              }
              return object2 != null && Object.prototype.hasOwnProperty.call(object2, sections[0]);
            }
            createDefaultSetCallback(state) {
              return (obj, field, value) => {
                if (state.remove || state.newKey) {
                  if (Array.isArray(obj)) {
                    obj.splice(field, 1);
                  } else {
                    delete obj[field];
                  }
                }
                if (!state.remove) {
                  const target = obj[state.newKey || field];
                  if (this.isRef(target)) {
                    this.setRefValue(target, value);
                  } else {
                    obj[state.newKey || field] = value;
                  }
                }
              };
            }
            isRef(ref) {
              return false;
            }
            setRefValue(ref, value) {
            }
            getRefValue(ref) {
              return ref;
            }
          }
          exports.StateEditor = StateEditor;
        }
      ),
      /***/
      "../shared-utils/lib/env.js": (
        /*!**********************************!*\
          !*** ../shared-utils/lib/env.js ***!
          \**********************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.initEnv = exports.keys = exports.isLinux = exports.isMac = exports.isWindows = exports.isFirefox = exports.isChrome = exports.target = exports.isBrowser = void 0;
          exports.isBrowser = typeof navigator !== "undefined" && typeof window !== "undefined";
          exports.target = exports.isBrowser ? window : typeof globalThis !== "undefined" ? globalThis : typeof commonjsGlobal !== "undefined" ? commonjsGlobal : typeof my !== "undefined" ? my : {};
          exports.isChrome = typeof exports.target.chrome !== "undefined" && !!exports.target.chrome.devtools;
          exports.isFirefox = exports.isBrowser && navigator.userAgent && navigator.userAgent.indexOf("Firefox") > -1;
          exports.isWindows = exports.isBrowser && navigator.platform.indexOf("Win") === 0;
          exports.isMac = exports.isBrowser && navigator.platform === "MacIntel";
          exports.isLinux = exports.isBrowser && navigator.platform.indexOf("Linux") === 0;
          exports.keys = {
            ctrl: exports.isMac ? "&#8984;" : "Ctrl",
            shift: "Shift",
            alt: exports.isMac ? "&#8997;" : "Alt",
            del: "Del",
            enter: "Enter",
            esc: "Esc"
          };
          function initEnv(Vue2) {
            if (Vue2.prototype.hasOwnProperty("$isChrome"))
              return;
            Object.defineProperties(Vue2.prototype, {
              $isChrome: {
                get: () => exports.isChrome
              },
              $isFirefox: {
                get: () => exports.isFirefox
              },
              $isWindows: {
                get: () => exports.isWindows
              },
              $isMac: {
                get: () => exports.isMac
              },
              $isLinux: {
                get: () => exports.isLinux
              },
              $keys: {
                get: () => exports.keys
              }
            });
            if (exports.isWindows)
              document.body.classList.add("platform-windows");
            if (exports.isMac)
              document.body.classList.add("platform-mac");
            if (exports.isLinux)
              document.body.classList.add("platform-linux");
          }
          exports.initEnv = initEnv;
        }
      ),
      /***/
      "../shared-utils/lib/index.js": (
        /*!************************************!*\
          !*** ../shared-utils/lib/index.js ***!
          \************************************/
        /***/
        function(__unused_webpack_module, exports, __webpack_require__2) {
          var __createBinding = this && this.__createBinding || (Object.create ? function(o2, m2, k2, k22) {
            if (k22 === void 0)
              k22 = k2;
            var desc = Object.getOwnPropertyDescriptor(m2, k2);
            if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
              desc = {
                enumerable: true,
                get: function() {
                  return m2[k2];
                }
              };
            }
            Object.defineProperty(o2, k22, desc);
          } : function(o2, m2, k2, k22) {
            if (k22 === void 0)
              k22 = k2;
            o2[k22] = m2[k2];
          });
          var __exportStar = this && this.__exportStar || function(m2, exports2) {
            for (var p2 in m2)
              if (p2 !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p2))
                __createBinding(exports2, m2, p2);
          };
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          __exportStar(__webpack_require__2(
            /*! ./backend */
            "../shared-utils/lib/backend.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./bridge */
            "../shared-utils/lib/bridge.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./consts */
            "../shared-utils/lib/consts.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./edit */
            "../shared-utils/lib/edit.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./env */
            "../shared-utils/lib/env.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./plugin-permissions */
            "../shared-utils/lib/plugin-permissions.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./plugin-settings */
            "../shared-utils/lib/plugin-settings.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./shared-data */
            "../shared-utils/lib/shared-data.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./shell */
            "../shared-utils/lib/shell.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./storage */
            "../shared-utils/lib/storage.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./transfer */
            "../shared-utils/lib/transfer.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./util */
            "../shared-utils/lib/util.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./raf */
            "../shared-utils/lib/raf.js"
          ), exports);
        }
      ),
      /***/
      "../shared-utils/lib/plugin-permissions.js": (
        /*!*************************************************!*\
          !*** ../shared-utils/lib/plugin-permissions.js ***!
          \*************************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.setPluginPermission = exports.hasPluginPermission = exports.PluginPermission = void 0;
          const shared_data_1 = __webpack_require__2(
            /*! ./shared-data */
            "../shared-utils/lib/shared-data.js"
          );
          (function(PluginPermission) {
            PluginPermission["ENABLED"] = "enabled";
            PluginPermission["COMPONENTS"] = "components";
            PluginPermission["CUSTOM_INSPECTOR"] = "custom-inspector";
            PluginPermission["TIMELINE"] = "timeline";
          })(exports.PluginPermission || (exports.PluginPermission = {}));
          function hasPluginPermission(pluginId, permission) {
            const result = shared_data_1.SharedData.pluginPermissions[`${pluginId}:${permission}`];
            if (result == null)
              return true;
            return !!result;
          }
          exports.hasPluginPermission = hasPluginPermission;
          function setPluginPermission(pluginId, permission, active) {
            shared_data_1.SharedData.pluginPermissions = {
              ...shared_data_1.SharedData.pluginPermissions,
              [`${pluginId}:${permission}`]: active
            };
          }
          exports.setPluginPermission = setPluginPermission;
        }
      ),
      /***/
      "../shared-utils/lib/plugin-settings.js": (
        /*!**********************************************!*\
          !*** ../shared-utils/lib/plugin-settings.js ***!
          \**********************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.getPluginDefaultSettings = exports.setPluginSettings = exports.getPluginSettings = void 0;
          const shared_data_1 = __webpack_require__2(
            /*! ./shared-data */
            "../shared-utils/lib/shared-data.js"
          );
          function getPluginSettings(pluginId, defaultSettings) {
            var _a;
            return {
              ...defaultSettings !== null && defaultSettings !== void 0 ? defaultSettings : {},
              ...(_a = shared_data_1.SharedData.pluginSettings[pluginId]) !== null && _a !== void 0 ? _a : {}
            };
          }
          exports.getPluginSettings = getPluginSettings;
          function setPluginSettings(pluginId, settings) {
            shared_data_1.SharedData.pluginSettings = {
              ...shared_data_1.SharedData.pluginSettings,
              [pluginId]: settings
            };
          }
          exports.setPluginSettings = setPluginSettings;
          function getPluginDefaultSettings(schema) {
            const result = {};
            if (schema) {
              for (const id in schema) {
                const item = schema[id];
                result[id] = item.defaultValue;
              }
            }
            return result;
          }
          exports.getPluginDefaultSettings = getPluginDefaultSettings;
        }
      ),
      /***/
      "../shared-utils/lib/raf.js": (
        /*!**********************************!*\
          !*** ../shared-utils/lib/raf.js ***!
          \**********************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.raf = void 0;
          let pendingCallbacks = [];
          exports.raf = typeof requestAnimationFrame === "function" ? requestAnimationFrame : typeof setImmediate === "function" ? (fn) => {
            if (!pendingCallbacks.length) {
              setImmediate(() => {
                const now = performance.now();
                const cbs = pendingCallbacks;
                pendingCallbacks = [];
                cbs.forEach((cb) => cb(now));
              });
            }
            pendingCallbacks.push(fn);
          } : function(callback) {
            return setTimeout(function() {
              callback(Date.now());
            }, 1e3 / 60);
          };
        }
      ),
      /***/
      "../shared-utils/lib/shared-data.js": (
        /*!******************************************!*\
          !*** ../shared-utils/lib/shared-data.js ***!
          \******************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.SharedData = exports.watchSharedData = exports.destroySharedData = exports.onSharedDataInit = exports.initSharedData = void 0;
          const storage_1 = __webpack_require__2(
            /*! ./storage */
            "../shared-utils/lib/storage.js"
          );
          const env_1 = __webpack_require__2(
            /*! ./env */
            "../shared-utils/lib/env.js"
          );
          const internalSharedData = {
            openInEditorHost: "/",
            componentNameStyle: "class",
            theme: "auto",
            displayDensity: "low",
            timeFormat: "default",
            recordVuex: true,
            cacheVuexSnapshotsEvery: 50,
            cacheVuexSnapshotsLimit: 10,
            snapshotLoading: false,
            componentEventsEnabled: true,
            performanceMonitoringEnabled: true,
            editableProps: false,
            logDetected: true,
            vuexNewBackend: false,
            vuexAutoload: false,
            vuexGroupGettersByModule: true,
            showMenuScrollTip: true,
            timelineTimeGrid: true,
            timelineScreenshots: true,
            menuStepScrolling: env_1.isMac,
            pluginPermissions: {},
            pluginSettings: {},
            pageConfig: {},
            legacyApps: false,
            trackUpdates: true,
            flashUpdates: false,
            debugInfo: false,
            isBrowser: env_1.isBrowser
          };
          const persisted = ["componentNameStyle", "theme", "displayDensity", "recordVuex", "editableProps", "logDetected", "vuexNewBackend", "vuexAutoload", "vuexGroupGettersByModule", "timeFormat", "showMenuScrollTip", "timelineTimeGrid", "timelineScreenshots", "menuStepScrolling", "pluginPermissions", "pluginSettings", "performanceMonitoringEnabled", "componentEventsEnabled", "trackUpdates", "flashUpdates", "debugInfo"];
          const storageVersion = "6.0.0-alpha.1";
          let bridge;
          let persist = false;
          let data;
          let initRetryInterval;
          let initRetryCount = 0;
          const initCbs = [];
          function initSharedData(params) {
            return new Promise((resolve) => {
              bridge = params.bridge;
              persist = !!params.persist;
              if (persist) {
                {
                  console.log("[shared data] Master init in progress...");
                }
                persisted.forEach((key) => {
                  const value = (0, storage_1.getStorage)(`vue-devtools-${storageVersion}:shared-data:${key}`);
                  if (value !== null) {
                    internalSharedData[key] = value;
                  }
                });
                bridge.on("shared-data:load", () => {
                  Object.keys(internalSharedData).forEach((key) => {
                    sendValue(key, internalSharedData[key]);
                  });
                  bridge.send("shared-data:load-complete");
                });
                bridge.on("shared-data:init-complete", () => {
                  {
                    console.log("[shared data] Master init complete");
                  }
                  clearInterval(initRetryInterval);
                  resolve();
                });
                bridge.send("shared-data:master-init-waiting");
                bridge.on("shared-data:minion-init-waiting", () => {
                  bridge.send("shared-data:master-init-waiting");
                });
                initRetryCount = 0;
                clearInterval(initRetryInterval);
                initRetryInterval = setInterval(() => {
                  {
                    console.log("[shared data] Master init retrying...");
                  }
                  bridge.send("shared-data:master-init-waiting");
                  initRetryCount++;
                  if (initRetryCount > 30) {
                    clearInterval(initRetryInterval);
                    console.error("[shared data] Master init failed");
                  }
                }, 2e3);
              } else {
                bridge.on("shared-data:master-init-waiting", () => {
                  bridge.send("shared-data:load");
                  bridge.once("shared-data:load-complete", () => {
                    bridge.send("shared-data:init-complete");
                    resolve();
                  });
                });
                bridge.send("shared-data:minion-init-waiting");
              }
              data = {
                ...internalSharedData
              };
              if (params.Vue) {
                data = params.Vue.observable(data);
              }
              bridge.on("shared-data:set", ({
                key,
                value
              }) => {
                setValue(key, value);
              });
              initCbs.forEach((cb) => cb());
            });
          }
          exports.initSharedData = initSharedData;
          function onSharedDataInit(cb) {
            initCbs.push(cb);
            return () => {
              const index2 = initCbs.indexOf(cb);
              if (index2 !== -1)
                initCbs.splice(index2, 1);
            };
          }
          exports.onSharedDataInit = onSharedDataInit;
          function destroySharedData() {
            bridge.removeAllListeners("shared-data:set");
            watchers = {};
          }
          exports.destroySharedData = destroySharedData;
          let watchers = {};
          function setValue(key, value) {
            if (persist && persisted.includes(key)) {
              (0, storage_1.setStorage)(`vue-devtools-${storageVersion}:shared-data:${key}`, value);
            }
            const oldValue = data[key];
            data[key] = value;
            const handlers = watchers[key];
            if (handlers) {
              handlers.forEach((h2) => h2(value, oldValue));
            }
            return true;
          }
          function sendValue(key, value) {
            bridge && bridge.send("shared-data:set", {
              key,
              value
            });
          }
          function watchSharedData(prop, handler) {
            const list = watchers[prop] || (watchers[prop] = []);
            list.push(handler);
            return () => {
              const index2 = list.indexOf(handler);
              if (index2 !== -1)
                list.splice(index2, 1);
            };
          }
          exports.watchSharedData = watchSharedData;
          const proxy = {};
          Object.keys(internalSharedData).forEach((key) => {
            Object.defineProperty(proxy, key, {
              configurable: false,
              get: () => data[key],
              set: (value) => {
                sendValue(key, value);
                setValue(key, value);
              }
            });
          });
          exports.SharedData = proxy;
        }
      ),
      /***/
      "../shared-utils/lib/shell.js": (
        /*!************************************!*\
          !*** ../shared-utils/lib/shell.js ***!
          \************************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
        }
      ),
      /***/
      "../shared-utils/lib/storage.js": (
        /*!**************************************!*\
          !*** ../shared-utils/lib/storage.js ***!
          \**************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.clearStorage = exports.removeStorage = exports.setStorage = exports.getStorage = exports.initStorage = void 0;
          const env_1 = __webpack_require__2(
            /*! ./env */
            "../shared-utils/lib/env.js"
          );
          const useStorage = typeof env_1.target.chrome !== "undefined" && typeof env_1.target.chrome.storage !== "undefined";
          let storageData = null;
          function initStorage() {
            return new Promise((resolve) => {
              if (useStorage) {
                env_1.target.chrome.storage.local.get(null, (result) => {
                  storageData = result;
                  resolve();
                });
              } else {
                storageData = {};
                resolve();
              }
            });
          }
          exports.initStorage = initStorage;
          function getStorage(key, defaultValue = null) {
            checkStorage();
            if (useStorage) {
              return getDefaultValue(storageData[key], defaultValue);
            } else {
              try {
                return getDefaultValue(JSON.parse(localStorage.getItem(key)), defaultValue);
              } catch (e) {
              }
            }
          }
          exports.getStorage = getStorage;
          function setStorage(key, val) {
            checkStorage();
            if (useStorage) {
              storageData[key] = val;
              env_1.target.chrome.storage.local.set({
                [key]: val
              });
            } else {
              try {
                localStorage.setItem(key, JSON.stringify(val));
              } catch (e) {
              }
            }
          }
          exports.setStorage = setStorage;
          function removeStorage(key) {
            checkStorage();
            if (useStorage) {
              delete storageData[key];
              env_1.target.chrome.storage.local.remove([key]);
            } else {
              try {
                localStorage.removeItem(key);
              } catch (e) {
              }
            }
          }
          exports.removeStorage = removeStorage;
          function clearStorage() {
            checkStorage();
            if (useStorage) {
              storageData = {};
              env_1.target.chrome.storage.local.clear();
            } else {
              try {
                localStorage.clear();
              } catch (e) {
              }
            }
          }
          exports.clearStorage = clearStorage;
          function checkStorage() {
            if (!storageData) {
              throw new Error("Storage wasn't initialized with 'init()'");
            }
          }
          function getDefaultValue(value, defaultValue) {
            if (value == null) {
              return defaultValue;
            }
            return value;
          }
        }
      ),
      /***/
      "../shared-utils/lib/transfer.js": (
        /*!***************************************!*\
          !*** ../shared-utils/lib/transfer.js ***!
          \***************************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.stringifyStrictCircularAutoChunks = exports.parseCircularAutoChunks = exports.stringifyCircularAutoChunks = void 0;
          const MAX_SERIALIZED_SIZE = 512 * 1024;
          function encode2(data, replacer, list, seen) {
            let stored, key, value, i2, l2;
            const seenIndex = seen.get(data);
            if (seenIndex != null) {
              return seenIndex;
            }
            const index2 = list.length;
            const proto = Object.prototype.toString.call(data);
            if (proto === "[object Object]") {
              stored = {};
              seen.set(data, index2);
              list.push(stored);
              const keys = Object.keys(data);
              for (i2 = 0, l2 = keys.length; i2 < l2; i2++) {
                key = keys[i2];
                try {
                  value = data[key];
                  if (replacer)
                    value = replacer.call(data, key, value);
                } catch (e) {
                  value = e;
                }
                stored[key] = encode2(value, replacer, list, seen);
              }
            } else if (proto === "[object Array]") {
              stored = [];
              seen.set(data, index2);
              list.push(stored);
              for (i2 = 0, l2 = data.length; i2 < l2; i2++) {
                try {
                  value = data[i2];
                  if (replacer)
                    value = replacer.call(data, i2, value);
                } catch (e) {
                  value = e;
                }
                stored[i2] = encode2(value, replacer, list, seen);
              }
            } else {
              list.push(data);
            }
            return index2;
          }
          function decode(list, reviver) {
            let i2 = list.length;
            let j2, k2, data, key, value, proto;
            while (i2--) {
              data = list[i2];
              proto = Object.prototype.toString.call(data);
              if (proto === "[object Object]") {
                const keys = Object.keys(data);
                for (j2 = 0, k2 = keys.length; j2 < k2; j2++) {
                  key = keys[j2];
                  value = list[data[key]];
                  if (reviver)
                    value = reviver.call(data, key, value);
                  data[key] = value;
                }
              } else if (proto === "[object Array]") {
                for (j2 = 0, k2 = data.length; j2 < k2; j2++) {
                  value = list[data[j2]];
                  if (reviver)
                    value = reviver.call(data, j2, value);
                  data[j2] = value;
                }
              }
            }
          }
          function stringifyCircularAutoChunks(data, replacer = null, space = null) {
            let result;
            try {
              result = arguments.length === 1 ? JSON.stringify(data) : JSON.stringify(data, replacer, space);
            } catch (e) {
              result = stringifyStrictCircularAutoChunks(data, replacer, space);
            }
            if (result.length > MAX_SERIALIZED_SIZE) {
              const chunkCount = Math.ceil(result.length / MAX_SERIALIZED_SIZE);
              const chunks = [];
              for (let i2 = 0; i2 < chunkCount; i2++) {
                chunks.push(result.slice(i2 * MAX_SERIALIZED_SIZE, (i2 + 1) * MAX_SERIALIZED_SIZE));
              }
              return chunks;
            }
            return result;
          }
          exports.stringifyCircularAutoChunks = stringifyCircularAutoChunks;
          function parseCircularAutoChunks(data, reviver = null) {
            if (Array.isArray(data)) {
              data = data.join("");
            }
            const hasCircular = /^\s/.test(data);
            if (!hasCircular) {
              return arguments.length === 1 ? JSON.parse(data) : JSON.parse(data, reviver);
            } else {
              const list = JSON.parse(data);
              decode(list, reviver);
              return list[0];
            }
          }
          exports.parseCircularAutoChunks = parseCircularAutoChunks;
          function stringifyStrictCircularAutoChunks(data, replacer = null, space = null) {
            const list = [];
            encode2(data, replacer, list, /* @__PURE__ */ new Map());
            return space ? " " + JSON.stringify(list, null, space) : " " + JSON.stringify(list);
          }
          exports.stringifyStrictCircularAutoChunks = stringifyStrictCircularAutoChunks;
        }
      ),
      /***/
      "../shared-utils/lib/util.js": (
        /*!***********************************!*\
          !*** ../shared-utils/lib/util.js ***!
          \***********************************/
        /***/
        function(__unused_webpack_module, exports, __webpack_require__2) {
          var __importDefault = this && this.__importDefault || function(mod) {
            return mod && mod.__esModule ? mod : {
              "default": mod
            };
          };
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.isEmptyObject = exports.copyToClipboard = exports.escape = exports.openInEditor = exports.focusInput = exports.simpleGet = exports.sortByKey = exports.searchDeepInObject = exports.isPlainObject = exports.revive = exports.parse = exports.getCustomRefDetails = exports.getCustomHTMLElementDetails = exports.getCustomFunctionDetails = exports.getCustomComponentDefinitionDetails = exports.getComponentName = exports.reviveSet = exports.getCustomSetDetails = exports.reviveMap = exports.getCustomMapDetails = exports.stringify = exports.specialTokenToString = exports.MAX_ARRAY_SIZE = exports.MAX_STRING_SIZE = exports.SPECIAL_TOKENS = exports.NAN = exports.NEGATIVE_INFINITY = exports.INFINITY = exports.UNDEFINED = exports.inDoc = exports.getComponentDisplayName = exports.kebabize = exports.camelize = exports.classify = void 0;
          const path_1 = __importDefault(__webpack_require__2(
            /*! path */
            "../../node_modules/path-browserify/index.js"
          ));
          const transfer_1 = __webpack_require__2(
            /*! ./transfer */
            "../shared-utils/lib/transfer.js"
          );
          const backend_1 = __webpack_require__2(
            /*! ./backend */
            "../shared-utils/lib/backend.js"
          );
          const shared_data_1 = __webpack_require__2(
            /*! ./shared-data */
            "../shared-utils/lib/shared-data.js"
          );
          const env_1 = __webpack_require__2(
            /*! ./env */
            "../shared-utils/lib/env.js"
          );
          function cached(fn) {
            const cache = /* @__PURE__ */ Object.create(null);
            return function cachedFn(str) {
              const hit = cache[str];
              return hit || (cache[str] = fn(str));
            };
          }
          const classifyRE = /(?:^|[-_/])(\w)/g;
          exports.classify = cached((str) => {
            return str && ("" + str).replace(classifyRE, toUpper);
          });
          const camelizeRE = /-(\w)/g;
          exports.camelize = cached((str) => {
            return str && str.replace(camelizeRE, toUpper);
          });
          const kebabizeRE = /([a-z0-9])([A-Z])/g;
          exports.kebabize = cached((str) => {
            return str && str.replace(kebabizeRE, (_2, lowerCaseCharacter, upperCaseLetter) => {
              return `${lowerCaseCharacter}-${upperCaseLetter}`;
            }).toLowerCase();
          });
          function toUpper(_2, c2) {
            return c2 ? c2.toUpperCase() : "";
          }
          function getComponentDisplayName(originalName, style = "class") {
            switch (style) {
              case "class":
                return (0, exports.classify)(originalName);
              case "kebab":
                return (0, exports.kebabize)(originalName);
              case "original":
              default:
                return originalName;
            }
          }
          exports.getComponentDisplayName = getComponentDisplayName;
          function inDoc(node) {
            if (!node)
              return false;
            const doc = node.ownerDocument.documentElement;
            const parent = node.parentNode;
            return doc === node || doc === parent || !!(parent && parent.nodeType === 1 && doc.contains(parent));
          }
          exports.inDoc = inDoc;
          exports.UNDEFINED = "__vue_devtool_undefined__";
          exports.INFINITY = "__vue_devtool_infinity__";
          exports.NEGATIVE_INFINITY = "__vue_devtool_negative_infinity__";
          exports.NAN = "__vue_devtool_nan__";
          exports.SPECIAL_TOKENS = {
            true: true,
            false: false,
            undefined: exports.UNDEFINED,
            null: null,
            "-Infinity": exports.NEGATIVE_INFINITY,
            Infinity: exports.INFINITY,
            NaN: exports.NAN
          };
          exports.MAX_STRING_SIZE = 1e4;
          exports.MAX_ARRAY_SIZE = 5e3;
          function specialTokenToString(value) {
            if (value === null) {
              return "null";
            } else if (value === exports.UNDEFINED) {
              return "undefined";
            } else if (value === exports.NAN) {
              return "NaN";
            } else if (value === exports.INFINITY) {
              return "Infinity";
            } else if (value === exports.NEGATIVE_INFINITY) {
              return "-Infinity";
            }
            return false;
          }
          exports.specialTokenToString = specialTokenToString;
          class EncodeCache {
            constructor() {
              this.map = /* @__PURE__ */ new Map();
            }
            /**
             * Returns a result unique to each input data
             * @param {*} data Input data
             * @param {*} factory Function used to create the unique result
             */
            cache(data, factory) {
              const cached2 = this.map.get(data);
              if (cached2) {
                return cached2;
              } else {
                const result = factory(data);
                this.map.set(data, result);
                return result;
              }
            }
            clear() {
              this.map.clear();
            }
          }
          const encodeCache = new EncodeCache();
          class ReviveCache {
            constructor(maxSize) {
              this.maxSize = maxSize;
              this.map = /* @__PURE__ */ new Map();
              this.index = 0;
              this.size = 0;
            }
            cache(value) {
              const currentIndex = this.index;
              this.map.set(currentIndex, value);
              this.size++;
              if (this.size > this.maxSize) {
                this.map.delete(currentIndex - this.size);
                this.size--;
              }
              this.index++;
              return currentIndex;
            }
            read(id) {
              return this.map.get(id);
            }
          }
          const reviveCache = new ReviveCache(1e3);
          const replacers = {
            internal: replacerForInternal,
            user: replaceForUser
          };
          function stringify(data, target = "internal") {
            encodeCache.clear();
            return (0, transfer_1.stringifyCircularAutoChunks)(data, replacers[target]);
          }
          exports.stringify = stringify;
          function replacerForInternal(key) {
            var _a;
            const val = this[key];
            const type = typeof val;
            if (Array.isArray(val)) {
              const l2 = val.length;
              if (l2 > exports.MAX_ARRAY_SIZE) {
                return {
                  _isArray: true,
                  length: l2,
                  items: val.slice(0, exports.MAX_ARRAY_SIZE)
                };
              }
              return val;
            } else if (typeof val === "string") {
              if (val.length > exports.MAX_STRING_SIZE) {
                return val.substring(0, exports.MAX_STRING_SIZE) + `... (${val.length} total length)`;
              } else {
                return val;
              }
            } else if (type === "undefined") {
              return exports.UNDEFINED;
            } else if (val === Infinity) {
              return exports.INFINITY;
            } else if (val === -Infinity) {
              return exports.NEGATIVE_INFINITY;
            } else if (type === "function") {
              return getCustomFunctionDetails(val);
            } else if (type === "symbol") {
              return `[native Symbol ${Symbol.prototype.toString.call(val)}]`;
            } else if (val !== null && type === "object") {
              const proto = Object.prototype.toString.call(val);
              if (proto === "[object Map]") {
                return encodeCache.cache(val, () => getCustomMapDetails(val));
              } else if (proto === "[object Set]") {
                return encodeCache.cache(val, () => getCustomSetDetails(val));
              } else if (proto === "[object RegExp]") {
                return `[native RegExp ${RegExp.prototype.toString.call(val)}]`;
              } else if (proto === "[object Date]") {
                return `[native Date ${Date.prototype.toString.call(val)}]`;
              } else if (proto === "[object Error]") {
                return `[native Error ${val.message}<>${val.stack}]`;
              } else if (val.state && val._vm) {
                return encodeCache.cache(val, () => (0, backend_1.getCustomStoreDetails)(val));
              } else if (val.constructor && val.constructor.name === "VueRouter") {
                return encodeCache.cache(val, () => (0, backend_1.getCustomRouterDetails)(val));
              } else if ((0, backend_1.isVueInstance)(val)) {
                return encodeCache.cache(val, () => (0, backend_1.getCustomInstanceDetails)(val));
              } else if (typeof val.render === "function") {
                return encodeCache.cache(val, () => getCustomComponentDefinitionDetails(val));
              } else if (val.constructor && val.constructor.name === "VNode") {
                return `[native VNode <${val.tag}>]`;
              } else if (typeof HTMLElement !== "undefined" && val instanceof HTMLElement) {
                return encodeCache.cache(val, () => getCustomHTMLElementDetails(val));
              } else if (((_a = val.constructor) === null || _a === void 0 ? void 0 : _a.name) === "Store" && val._wrappedGetters) {
                return `[object Store]`;
              } else if (val.currentRoute) {
                return `[object Router]`;
              }
              const customDetails = (0, backend_1.getCustomObjectDetails)(val, proto);
              if (customDetails != null)
                return customDetails;
            } else if (Number.isNaN(val)) {
              return exports.NAN;
            }
            return sanitize(val);
          }
          function replaceForUser(key) {
            let val = this[key];
            const type = typeof val;
            if ((val === null || val === void 0 ? void 0 : val._custom) && "value" in val._custom) {
              val = val._custom.value;
            }
            if (type !== "object") {
              if (val === exports.UNDEFINED) {
                return void 0;
              } else if (val === exports.INFINITY) {
                return Infinity;
              } else if (val === exports.NEGATIVE_INFINITY) {
                return -Infinity;
              } else if (val === exports.NAN) {
                return NaN;
              }
              return val;
            }
            return sanitize(val);
          }
          function getCustomMapDetails(val) {
            const list = [];
            val.forEach((value, key) => list.push({
              key,
              value
            }));
            return {
              _custom: {
                type: "map",
                display: "Map",
                value: list,
                readOnly: true,
                fields: {
                  abstract: true
                }
              }
            };
          }
          exports.getCustomMapDetails = getCustomMapDetails;
          function reviveMap(val) {
            const result = /* @__PURE__ */ new Map();
            const list = val._custom.value;
            for (let i2 = 0; i2 < list.length; i2++) {
              const {
                key,
                value
              } = list[i2];
              result.set(key, revive(value));
            }
            return result;
          }
          exports.reviveMap = reviveMap;
          function getCustomSetDetails(val) {
            const list = Array.from(val);
            return {
              _custom: {
                type: "set",
                display: `Set[${list.length}]`,
                value: list,
                readOnly: true
              }
            };
          }
          exports.getCustomSetDetails = getCustomSetDetails;
          function reviveSet(val) {
            const result = /* @__PURE__ */ new Set();
            const list = val._custom.value;
            for (let i2 = 0; i2 < list.length; i2++) {
              const value = list[i2];
              result.add(revive(value));
            }
            return result;
          }
          exports.reviveSet = reviveSet;
          function basename(filename, ext) {
            return path_1.default.basename(filename.replace(/^[a-zA-Z]:/, "").replace(/\\/g, "/"), ext);
          }
          function getComponentName(options) {
            const name = options.displayName || options.name || options._componentTag;
            if (name) {
              return name;
            }
            const file = options.__file;
            if (file) {
              return (0, exports.classify)(basename(file, ".vue"));
            }
          }
          exports.getComponentName = getComponentName;
          function getCustomComponentDefinitionDetails(def) {
            let display = getComponentName(def);
            if (display) {
              if (def.name && def.__file) {
                display += ` <span>(${def.__file})</span>`;
              }
            } else {
              display = "<i>Unknown Component</i>";
            }
            return {
              _custom: {
                type: "component-definition",
                display,
                tooltip: "Component definition",
                ...def.__file ? {
                  file: def.__file
                } : {}
              }
            };
          }
          exports.getCustomComponentDefinitionDetails = getCustomComponentDefinitionDetails;
          function getCustomFunctionDetails(func2) {
            let string2 = "";
            let matches = null;
            try {
              string2 = Function.prototype.toString.call(func2);
              matches = String.prototype.match.call(string2, /\([\s\S]*?\)/);
            } catch (e) {
            }
            const match = matches && matches[0];
            const args = typeof match === "string" ? match : "(?)";
            const name = typeof func2.name === "string" ? func2.name : "";
            return {
              _custom: {
                type: "function",
                display: `<span style="opacity:.5;">function</span> ${escape2(name)}${args}`,
                tooltip: string2.trim() ? `<pre>${string2}</pre>` : null,
                _reviveId: reviveCache.cache(func2)
              }
            };
          }
          exports.getCustomFunctionDetails = getCustomFunctionDetails;
          function getCustomHTMLElementDetails(value) {
            try {
              return {
                _custom: {
                  type: "HTMLElement",
                  display: `<span class="opacity-30">&lt;</span><span class="text-blue-500">${value.tagName.toLowerCase()}</span><span class="opacity-30">&gt;</span>`,
                  value: namedNodeMapToObject(value.attributes),
                  actions: [{
                    icon: "input",
                    tooltip: "Log element to console",
                    action: () => {
                      console.log(value);
                    }
                  }]
                }
              };
            } catch (e) {
              return {
                _custom: {
                  type: "HTMLElement",
                  display: `<span class="text-blue-500">${String(value)}</span>`
                }
              };
            }
          }
          exports.getCustomHTMLElementDetails = getCustomHTMLElementDetails;
          function namedNodeMapToObject(map) {
            const result = {};
            const l2 = map.length;
            for (let i2 = 0; i2 < l2; i2++) {
              const node = map.item(i2);
              result[node.name] = node.value;
            }
            return result;
          }
          function getCustomRefDetails(instance, key, ref) {
            let value;
            if (Array.isArray(ref)) {
              value = ref.map((r2) => getCustomRefDetails(instance, key, r2)).map((data) => data.value);
            } else {
              let name;
              if (ref._isVue) {
                name = getComponentName(ref.$options);
              } else {
                name = ref.tagName.toLowerCase();
              }
              value = {
                _custom: {
                  display: `&lt;${name}` + (ref.id ? ` <span class="attr-title">id</span>="${ref.id}"` : "") + (ref.className ? ` <span class="attr-title">class</span>="${ref.className}"` : "") + "&gt;",
                  uid: instance.__VUE_DEVTOOLS_UID__,
                  type: "reference"
                }
              };
            }
            return {
              type: "$refs",
              key,
              value,
              editable: false
            };
          }
          exports.getCustomRefDetails = getCustomRefDetails;
          function parse2(data, revive2 = false) {
            return revive2 ? (0, transfer_1.parseCircularAutoChunks)(data, reviver) : (0, transfer_1.parseCircularAutoChunks)(data);
          }
          exports.parse = parse2;
          const specialTypeRE = /^\[native (\w+) (.*?)(<>((.|\s)*))?\]$/;
          const symbolRE = /^\[native Symbol Symbol\((.*)\)\]$/;
          function reviver(key, val) {
            return revive(val);
          }
          function revive(val) {
            if (val === exports.UNDEFINED) {
              return void 0;
            } else if (val === exports.INFINITY) {
              return Infinity;
            } else if (val === exports.NEGATIVE_INFINITY) {
              return -Infinity;
            } else if (val === exports.NAN) {
              return NaN;
            } else if (val && val._custom) {
              const {
                _custom: custom
              } = val;
              if (custom.type === "component") {
                return (0, backend_1.getInstanceMap)().get(custom.id);
              } else if (custom.type === "map") {
                return reviveMap(val);
              } else if (custom.type === "set") {
                return reviveSet(val);
              } else if (custom._reviveId) {
                return reviveCache.read(custom._reviveId);
              } else {
                return revive(custom.value);
              }
            } else if (symbolRE.test(val)) {
              const [, string2] = symbolRE.exec(val);
              return Symbol.for(string2);
            } else if (specialTypeRE.test(val)) {
              const [, type, string2, , details] = specialTypeRE.exec(val);
              const result = new env_1.target[type](string2);
              if (type === "Error" && details) {
                result.stack = details;
              }
              return result;
            } else {
              return val;
            }
          }
          exports.revive = revive;
          function sanitize(data) {
            if (!isPrimitive(data) && !Array.isArray(data) && !isPlainObject2(data)) {
              return Object.prototype.toString.call(data);
            } else {
              return data;
            }
          }
          function isPlainObject2(obj) {
            return Object.prototype.toString.call(obj) === "[object Object]";
          }
          exports.isPlainObject = isPlainObject2;
          function isPrimitive(data) {
            if (data == null) {
              return true;
            }
            const type = typeof data;
            return type === "string" || type === "number" || type === "boolean";
          }
          function searchDeepInObject(obj, searchTerm) {
            const seen = /* @__PURE__ */ new Map();
            const result = internalSearchObject(obj, searchTerm.toLowerCase(), seen, 0);
            seen.clear();
            return result;
          }
          exports.searchDeepInObject = searchDeepInObject;
          const SEARCH_MAX_DEPTH = 10;
          function internalSearchObject(obj, searchTerm, seen, depth) {
            if (depth > SEARCH_MAX_DEPTH) {
              return false;
            }
            let match = false;
            const keys = Object.keys(obj);
            let key, value;
            for (let i2 = 0; i2 < keys.length; i2++) {
              key = keys[i2];
              value = obj[key];
              match = internalSearchCheck(searchTerm, key, value, seen, depth + 1);
              if (match) {
                break;
              }
            }
            return match;
          }
          function internalSearchArray(array2, searchTerm, seen, depth) {
            if (depth > SEARCH_MAX_DEPTH) {
              return false;
            }
            let match = false;
            let value;
            for (let i2 = 0; i2 < array2.length; i2++) {
              value = array2[i2];
              match = internalSearchCheck(searchTerm, null, value, seen, depth + 1);
              if (match) {
                break;
              }
            }
            return match;
          }
          function internalSearchCheck(searchTerm, key, value, seen, depth) {
            let match = false;
            let result;
            if (key === "_custom") {
              key = value.display;
              value = value.value;
            }
            (result = specialTokenToString(value)) && (value = result);
            if (key && compare(key, searchTerm)) {
              match = true;
              seen.set(value, true);
            } else if (seen.has(value)) {
              match = seen.get(value);
            } else if (Array.isArray(value)) {
              seen.set(value, null);
              match = internalSearchArray(value, searchTerm, seen, depth);
              seen.set(value, match);
            } else if (isPlainObject2(value)) {
              seen.set(value, null);
              match = internalSearchObject(value, searchTerm, seen, depth);
              seen.set(value, match);
            } else if (compare(value, searchTerm)) {
              match = true;
              seen.set(value, true);
            }
            return match;
          }
          function compare(value, searchTerm) {
            return ("" + value).toLowerCase().indexOf(searchTerm) !== -1;
          }
          function sortByKey(state) {
            return state && state.slice().sort((a2, b2) => {
              if (a2.key < b2.key)
                return -1;
              if (a2.key > b2.key)
                return 1;
              return 0;
            });
          }
          exports.sortByKey = sortByKey;
          function simpleGet(object2, path) {
            const sections = Array.isArray(path) ? path : path.split(".");
            for (let i2 = 0; i2 < sections.length; i2++) {
              object2 = object2[sections[i2]];
              if (!object2) {
                return void 0;
              }
            }
            return object2;
          }
          exports.simpleGet = simpleGet;
          function focusInput(el) {
            el.focus();
            el.setSelectionRange(0, el.value.length);
          }
          exports.focusInput = focusInput;
          function openInEditor(file) {
            const fileName = file.replace(/\\/g, "\\\\");
            const src = `fetch('${shared_data_1.SharedData.openInEditorHost}__open-in-editor?file=${encodeURI(file)}').then(response => {
    if (response.ok) {
      console.log('File ${fileName} opened in editor')
    } else {
      const msg = 'Opening component ${fileName} failed'
      const target = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : {}
      if (target.__VUE_DEVTOOLS_TOAST__) {
        target.__VUE_DEVTOOLS_TOAST__(msg, 'error')
      } else {
        console.log('%c' + msg, 'color:red')
      }
      console.log('Check the setup of your project, see https://devtools.vuejs.org/guide/open-in-editor.html')
    }
  })`;
            if (env_1.isChrome) {
              env_1.target.chrome.devtools.inspectedWindow.eval(src);
            } else {
              [eval][0](src);
            }
          }
          exports.openInEditor = openInEditor;
          const ESC = {
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "&": "&amp;"
          };
          function escape2(s2) {
            return s2.replace(/[<>"&]/g, escapeChar);
          }
          exports.escape = escape2;
          function escapeChar(a2) {
            return ESC[a2] || a2;
          }
          function copyToClipboard(state) {
            let text;
            if (typeof state !== "object") {
              text = String(state);
            } else {
              text = stringify(state, "user");
            }
            if (typeof document === "undefined")
              return;
            const dummyTextArea = document.createElement("textarea");
            dummyTextArea.textContent = text;
            document.body.appendChild(dummyTextArea);
            dummyTextArea.select();
            document.execCommand("copy");
            document.body.removeChild(dummyTextArea);
          }
          exports.copyToClipboard = copyToClipboard;
          function isEmptyObject(obj) {
            return obj === exports.UNDEFINED || !obj || Object.keys(obj).length === 0;
          }
          exports.isEmptyObject = isEmptyObject;
        }
      ),
      /***/
      "../../node_modules/events/events.js": (
        /*!*******************************************!*\
          !*** ../../node_modules/events/events.js ***!
          \*******************************************/
        /***/
        (module) => {
          var R2 = typeof Reflect === "object" ? Reflect : null;
          var ReflectApply = R2 && typeof R2.apply === "function" ? R2.apply : function ReflectApply2(target, receiver, args) {
            return Function.prototype.apply.call(target, receiver, args);
          };
          var ReflectOwnKeys;
          if (R2 && typeof R2.ownKeys === "function") {
            ReflectOwnKeys = R2.ownKeys;
          } else if (Object.getOwnPropertySymbols) {
            ReflectOwnKeys = function ReflectOwnKeys2(target) {
              return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
            };
          } else {
            ReflectOwnKeys = function ReflectOwnKeys2(target) {
              return Object.getOwnPropertyNames(target);
            };
          }
          function ProcessEmitWarning(warning) {
            if (console && console.warn)
              console.warn(warning);
          }
          var NumberIsNaN = Number.isNaN || function NumberIsNaN2(value) {
            return value !== value;
          };
          function EventEmitter() {
            EventEmitter.init.call(this);
          }
          module.exports = EventEmitter;
          module.exports.once = once;
          EventEmitter.EventEmitter = EventEmitter;
          EventEmitter.prototype._events = void 0;
          EventEmitter.prototype._eventsCount = 0;
          EventEmitter.prototype._maxListeners = void 0;
          var defaultMaxListeners = 10;
          function checkListener(listener) {
            if (typeof listener !== "function") {
              throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
            }
          }
          Object.defineProperty(EventEmitter, "defaultMaxListeners", {
            enumerable: true,
            get: function() {
              return defaultMaxListeners;
            },
            set: function(arg) {
              if (typeof arg !== "number" || arg < 0 || NumberIsNaN(arg)) {
                throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + ".");
              }
              defaultMaxListeners = arg;
            }
          });
          EventEmitter.init = function() {
            if (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) {
              this._events = /* @__PURE__ */ Object.create(null);
              this._eventsCount = 0;
            }
            this._maxListeners = this._maxListeners || void 0;
          };
          EventEmitter.prototype.setMaxListeners = function setMaxListeners(n2) {
            if (typeof n2 !== "number" || n2 < 0 || NumberIsNaN(n2)) {
              throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n2 + ".");
            }
            this._maxListeners = n2;
            return this;
          };
          function _getMaxListeners(that) {
            if (that._maxListeners === void 0)
              return EventEmitter.defaultMaxListeners;
            return that._maxListeners;
          }
          EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
            return _getMaxListeners(this);
          };
          EventEmitter.prototype.emit = function emit(type) {
            var args = [];
            for (var i2 = 1; i2 < arguments.length; i2++)
              args.push(arguments[i2]);
            var doError = type === "error";
            var events = this._events;
            if (events !== void 0)
              doError = doError && events.error === void 0;
            else if (!doError)
              return false;
            if (doError) {
              var er;
              if (args.length > 0)
                er = args[0];
              if (er instanceof Error) {
                throw er;
              }
              var err = new Error("Unhandled error." + (er ? " (" + er.message + ")" : ""));
              err.context = er;
              throw err;
            }
            var handler = events[type];
            if (handler === void 0)
              return false;
            if (typeof handler === "function") {
              ReflectApply(handler, this, args);
            } else {
              var len = handler.length;
              var listeners = arrayClone(handler, len);
              for (var i2 = 0; i2 < len; ++i2)
                ReflectApply(listeners[i2], this, args);
            }
            return true;
          };
          function _addListener(target, type, listener, prepend) {
            var m2;
            var events;
            var existing;
            checkListener(listener);
            events = target._events;
            if (events === void 0) {
              events = target._events = /* @__PURE__ */ Object.create(null);
              target._eventsCount = 0;
            } else {
              if (events.newListener !== void 0) {
                target.emit(
                  "newListener",
                  type,
                  listener.listener ? listener.listener : listener
                );
                events = target._events;
              }
              existing = events[type];
            }
            if (existing === void 0) {
              existing = events[type] = listener;
              ++target._eventsCount;
            } else {
              if (typeof existing === "function") {
                existing = events[type] = prepend ? [listener, existing] : [existing, listener];
              } else if (prepend) {
                existing.unshift(listener);
              } else {
                existing.push(listener);
              }
              m2 = _getMaxListeners(target);
              if (m2 > 0 && existing.length > m2 && !existing.warned) {
                existing.warned = true;
                var w2 = new Error("Possible EventEmitter memory leak detected. " + existing.length + " " + String(type) + " listeners added. Use emitter.setMaxListeners() to increase limit");
                w2.name = "MaxListenersExceededWarning";
                w2.emitter = target;
                w2.type = type;
                w2.count = existing.length;
                ProcessEmitWarning(w2);
              }
            }
            return target;
          }
          EventEmitter.prototype.addListener = function addListener(type, listener) {
            return _addListener(this, type, listener, false);
          };
          EventEmitter.prototype.on = EventEmitter.prototype.addListener;
          EventEmitter.prototype.prependListener = function prependListener(type, listener) {
            return _addListener(this, type, listener, true);
          };
          function onceWrapper() {
            if (!this.fired) {
              this.target.removeListener(this.type, this.wrapFn);
              this.fired = true;
              if (arguments.length === 0)
                return this.listener.call(this.target);
              return this.listener.apply(this.target, arguments);
            }
          }
          function _onceWrap(target, type, listener) {
            var state = { fired: false, wrapFn: void 0, target, type, listener };
            var wrapped = onceWrapper.bind(state);
            wrapped.listener = listener;
            state.wrapFn = wrapped;
            return wrapped;
          }
          EventEmitter.prototype.once = function once2(type, listener) {
            checkListener(listener);
            this.on(type, _onceWrap(this, type, listener));
            return this;
          };
          EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
            checkListener(listener);
            this.prependListener(type, _onceWrap(this, type, listener));
            return this;
          };
          EventEmitter.prototype.removeListener = function removeListener(type, listener) {
            var list, events, position, i2, originalListener;
            checkListener(listener);
            events = this._events;
            if (events === void 0)
              return this;
            list = events[type];
            if (list === void 0)
              return this;
            if (list === listener || list.listener === listener) {
              if (--this._eventsCount === 0)
                this._events = /* @__PURE__ */ Object.create(null);
              else {
                delete events[type];
                if (events.removeListener)
                  this.emit("removeListener", type, list.listener || listener);
              }
            } else if (typeof list !== "function") {
              position = -1;
              for (i2 = list.length - 1; i2 >= 0; i2--) {
                if (list[i2] === listener || list[i2].listener === listener) {
                  originalListener = list[i2].listener;
                  position = i2;
                  break;
                }
              }
              if (position < 0)
                return this;
              if (position === 0)
                list.shift();
              else {
                spliceOne(list, position);
              }
              if (list.length === 1)
                events[type] = list[0];
              if (events.removeListener !== void 0)
                this.emit("removeListener", type, originalListener || listener);
            }
            return this;
          };
          EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
          EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
            var listeners, events, i2;
            events = this._events;
            if (events === void 0)
              return this;
            if (events.removeListener === void 0) {
              if (arguments.length === 0) {
                this._events = /* @__PURE__ */ Object.create(null);
                this._eventsCount = 0;
              } else if (events[type] !== void 0) {
                if (--this._eventsCount === 0)
                  this._events = /* @__PURE__ */ Object.create(null);
                else
                  delete events[type];
              }
              return this;
            }
            if (arguments.length === 0) {
              var keys = Object.keys(events);
              var key;
              for (i2 = 0; i2 < keys.length; ++i2) {
                key = keys[i2];
                if (key === "removeListener")
                  continue;
                this.removeAllListeners(key);
              }
              this.removeAllListeners("removeListener");
              this._events = /* @__PURE__ */ Object.create(null);
              this._eventsCount = 0;
              return this;
            }
            listeners = events[type];
            if (typeof listeners === "function") {
              this.removeListener(type, listeners);
            } else if (listeners !== void 0) {
              for (i2 = listeners.length - 1; i2 >= 0; i2--) {
                this.removeListener(type, listeners[i2]);
              }
            }
            return this;
          };
          function _listeners(target, type, unwrap) {
            var events = target._events;
            if (events === void 0)
              return [];
            var evlistener = events[type];
            if (evlistener === void 0)
              return [];
            if (typeof evlistener === "function")
              return unwrap ? [evlistener.listener || evlistener] : [evlistener];
            return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
          }
          EventEmitter.prototype.listeners = function listeners(type) {
            return _listeners(this, type, true);
          };
          EventEmitter.prototype.rawListeners = function rawListeners(type) {
            return _listeners(this, type, false);
          };
          EventEmitter.listenerCount = function(emitter, type) {
            if (typeof emitter.listenerCount === "function") {
              return emitter.listenerCount(type);
            } else {
              return listenerCount.call(emitter, type);
            }
          };
          EventEmitter.prototype.listenerCount = listenerCount;
          function listenerCount(type) {
            var events = this._events;
            if (events !== void 0) {
              var evlistener = events[type];
              if (typeof evlistener === "function") {
                return 1;
              } else if (evlistener !== void 0) {
                return evlistener.length;
              }
            }
            return 0;
          }
          EventEmitter.prototype.eventNames = function eventNames() {
            return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
          };
          function arrayClone(arr, n2) {
            var copy = new Array(n2);
            for (var i2 = 0; i2 < n2; ++i2)
              copy[i2] = arr[i2];
            return copy;
          }
          function spliceOne(list, index2) {
            for (; index2 + 1 < list.length; index2++)
              list[index2] = list[index2 + 1];
            list.pop();
          }
          function unwrapListeners(arr) {
            var ret = new Array(arr.length);
            for (var i2 = 0; i2 < ret.length; ++i2) {
              ret[i2] = arr[i2].listener || arr[i2];
            }
            return ret;
          }
          function once(emitter, name) {
            return new Promise(function(resolve, reject) {
              function errorListener(err) {
                emitter.removeListener(name, resolver);
                reject(err);
              }
              function resolver() {
                if (typeof emitter.removeListener === "function") {
                  emitter.removeListener("error", errorListener);
                }
                resolve([].slice.call(arguments));
              }
              eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
              if (name !== "error") {
                addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
              }
            });
          }
          function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
            if (typeof emitter.on === "function") {
              eventTargetAgnosticAddListener(emitter, "error", handler, flags);
            }
          }
          function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
            if (typeof emitter.on === "function") {
              if (flags.once) {
                emitter.once(name, listener);
              } else {
                emitter.on(name, listener);
              }
            } else if (typeof emitter.addEventListener === "function") {
              emitter.addEventListener(name, function wrapListener(arg) {
                if (flags.once) {
                  emitter.removeEventListener(name, wrapListener);
                }
                listener(arg);
              });
            } else {
              throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
            }
          }
        }
      ),
      /***/
      "../../node_modules/path-browserify/index.js": (
        /*!***************************************************!*\
          !*** ../../node_modules/path-browserify/index.js ***!
          \***************************************************/
        /***/
        (module) => {
          function assertPath(path) {
            if (typeof path !== "string") {
              throw new TypeError("Path must be a string. Received " + JSON.stringify(path));
            }
          }
          function normalizeStringPosix(path, allowAboveRoot) {
            var res = "";
            var lastSegmentLength = 0;
            var lastSlash = -1;
            var dots = 0;
            var code2;
            for (var i2 = 0; i2 <= path.length; ++i2) {
              if (i2 < path.length)
                code2 = path.charCodeAt(i2);
              else if (code2 === 47)
                break;
              else
                code2 = 47;
              if (code2 === 47) {
                if (lastSlash === i2 - 1 || dots === 1)
                  ;
                else if (lastSlash !== i2 - 1 && dots === 2) {
                  if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                    if (res.length > 2) {
                      var lastSlashIndex = res.lastIndexOf("/");
                      if (lastSlashIndex !== res.length - 1) {
                        if (lastSlashIndex === -1) {
                          res = "";
                          lastSegmentLength = 0;
                        } else {
                          res = res.slice(0, lastSlashIndex);
                          lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
                        }
                        lastSlash = i2;
                        dots = 0;
                        continue;
                      }
                    } else if (res.length === 2 || res.length === 1) {
                      res = "";
                      lastSegmentLength = 0;
                      lastSlash = i2;
                      dots = 0;
                      continue;
                    }
                  }
                  if (allowAboveRoot) {
                    if (res.length > 0)
                      res += "/..";
                    else
                      res = "..";
                    lastSegmentLength = 2;
                  }
                } else {
                  if (res.length > 0)
                    res += "/" + path.slice(lastSlash + 1, i2);
                  else
                    res = path.slice(lastSlash + 1, i2);
                  lastSegmentLength = i2 - lastSlash - 1;
                }
                lastSlash = i2;
                dots = 0;
              } else if (code2 === 46 && dots !== -1) {
                ++dots;
              } else {
                dots = -1;
              }
            }
            return res;
          }
          function _format(sep, pathObject) {
            var dir = pathObject.dir || pathObject.root;
            var base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
            if (!dir) {
              return base;
            }
            if (dir === pathObject.root) {
              return dir + base;
            }
            return dir + sep + base;
          }
          var posix = {
            // path.resolve([from ...], to)
            resolve: function resolve() {
              var resolvedPath = "";
              var resolvedAbsolute = false;
              var cwd;
              for (var i2 = arguments.length - 1; i2 >= -1 && !resolvedAbsolute; i2--) {
                var path;
                if (i2 >= 0)
                  path = arguments[i2];
                else {
                  if (cwd === void 0)
                    cwd = process.cwd();
                  path = cwd;
                }
                assertPath(path);
                if (path.length === 0) {
                  continue;
                }
                resolvedPath = path + "/" + resolvedPath;
                resolvedAbsolute = path.charCodeAt(0) === 47;
              }
              resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);
              if (resolvedAbsolute) {
                if (resolvedPath.length > 0)
                  return "/" + resolvedPath;
                else
                  return "/";
              } else if (resolvedPath.length > 0) {
                return resolvedPath;
              } else {
                return ".";
              }
            },
            normalize: function normalize(path) {
              assertPath(path);
              if (path.length === 0)
                return ".";
              var isAbsolute = path.charCodeAt(0) === 47;
              var trailingSeparator = path.charCodeAt(path.length - 1) === 47;
              path = normalizeStringPosix(path, !isAbsolute);
              if (path.length === 0 && !isAbsolute)
                path = ".";
              if (path.length > 0 && trailingSeparator)
                path += "/";
              if (isAbsolute)
                return "/" + path;
              return path;
            },
            isAbsolute: function isAbsolute(path) {
              assertPath(path);
              return path.length > 0 && path.charCodeAt(0) === 47;
            },
            join: function join() {
              if (arguments.length === 0)
                return ".";
              var joined;
              for (var i2 = 0; i2 < arguments.length; ++i2) {
                var arg = arguments[i2];
                assertPath(arg);
                if (arg.length > 0) {
                  if (joined === void 0)
                    joined = arg;
                  else
                    joined += "/" + arg;
                }
              }
              if (joined === void 0)
                return ".";
              return posix.normalize(joined);
            },
            relative: function relative(from, to) {
              assertPath(from);
              assertPath(to);
              if (from === to)
                return "";
              from = posix.resolve(from);
              to = posix.resolve(to);
              if (from === to)
                return "";
              var fromStart = 1;
              for (; fromStart < from.length; ++fromStart) {
                if (from.charCodeAt(fromStart) !== 47)
                  break;
              }
              var fromEnd = from.length;
              var fromLen = fromEnd - fromStart;
              var toStart = 1;
              for (; toStart < to.length; ++toStart) {
                if (to.charCodeAt(toStart) !== 47)
                  break;
              }
              var toEnd = to.length;
              var toLen = toEnd - toStart;
              var length = fromLen < toLen ? fromLen : toLen;
              var lastCommonSep = -1;
              var i2 = 0;
              for (; i2 <= length; ++i2) {
                if (i2 === length) {
                  if (toLen > length) {
                    if (to.charCodeAt(toStart + i2) === 47) {
                      return to.slice(toStart + i2 + 1);
                    } else if (i2 === 0) {
                      return to.slice(toStart + i2);
                    }
                  } else if (fromLen > length) {
                    if (from.charCodeAt(fromStart + i2) === 47) {
                      lastCommonSep = i2;
                    } else if (i2 === 0) {
                      lastCommonSep = 0;
                    }
                  }
                  break;
                }
                var fromCode = from.charCodeAt(fromStart + i2);
                var toCode = to.charCodeAt(toStart + i2);
                if (fromCode !== toCode)
                  break;
                else if (fromCode === 47)
                  lastCommonSep = i2;
              }
              var out = "";
              for (i2 = fromStart + lastCommonSep + 1; i2 <= fromEnd; ++i2) {
                if (i2 === fromEnd || from.charCodeAt(i2) === 47) {
                  if (out.length === 0)
                    out += "..";
                  else
                    out += "/..";
                }
              }
              if (out.length > 0)
                return out + to.slice(toStart + lastCommonSep);
              else {
                toStart += lastCommonSep;
                if (to.charCodeAt(toStart) === 47)
                  ++toStart;
                return to.slice(toStart);
              }
            },
            _makeLong: function _makeLong(path) {
              return path;
            },
            dirname: function dirname(path) {
              assertPath(path);
              if (path.length === 0)
                return ".";
              var code2 = path.charCodeAt(0);
              var hasRoot = code2 === 47;
              var end = -1;
              var matchedSlash = true;
              for (var i2 = path.length - 1; i2 >= 1; --i2) {
                code2 = path.charCodeAt(i2);
                if (code2 === 47) {
                  if (!matchedSlash) {
                    end = i2;
                    break;
                  }
                } else {
                  matchedSlash = false;
                }
              }
              if (end === -1)
                return hasRoot ? "/" : ".";
              if (hasRoot && end === 1)
                return "//";
              return path.slice(0, end);
            },
            basename: function basename(path, ext) {
              if (ext !== void 0 && typeof ext !== "string")
                throw new TypeError('"ext" argument must be a string');
              assertPath(path);
              var start = 0;
              var end = -1;
              var matchedSlash = true;
              var i2;
              if (ext !== void 0 && ext.length > 0 && ext.length <= path.length) {
                if (ext.length === path.length && ext === path)
                  return "";
                var extIdx = ext.length - 1;
                var firstNonSlashEnd = -1;
                for (i2 = path.length - 1; i2 >= 0; --i2) {
                  var code2 = path.charCodeAt(i2);
                  if (code2 === 47) {
                    if (!matchedSlash) {
                      start = i2 + 1;
                      break;
                    }
                  } else {
                    if (firstNonSlashEnd === -1) {
                      matchedSlash = false;
                      firstNonSlashEnd = i2 + 1;
                    }
                    if (extIdx >= 0) {
                      if (code2 === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                          end = i2;
                        }
                      } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                      }
                    }
                  }
                }
                if (start === end)
                  end = firstNonSlashEnd;
                else if (end === -1)
                  end = path.length;
                return path.slice(start, end);
              } else {
                for (i2 = path.length - 1; i2 >= 0; --i2) {
                  if (path.charCodeAt(i2) === 47) {
                    if (!matchedSlash) {
                      start = i2 + 1;
                      break;
                    }
                  } else if (end === -1) {
                    matchedSlash = false;
                    end = i2 + 1;
                  }
                }
                if (end === -1)
                  return "";
                return path.slice(start, end);
              }
            },
            extname: function extname(path) {
              assertPath(path);
              var startDot = -1;
              var startPart = 0;
              var end = -1;
              var matchedSlash = true;
              var preDotState = 0;
              for (var i2 = path.length - 1; i2 >= 0; --i2) {
                var code2 = path.charCodeAt(i2);
                if (code2 === 47) {
                  if (!matchedSlash) {
                    startPart = i2 + 1;
                    break;
                  }
                  continue;
                }
                if (end === -1) {
                  matchedSlash = false;
                  end = i2 + 1;
                }
                if (code2 === 46) {
                  if (startDot === -1)
                    startDot = i2;
                  else if (preDotState !== 1)
                    preDotState = 1;
                } else if (startDot !== -1) {
                  preDotState = -1;
                }
              }
              if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
              preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
              preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
                return "";
              }
              return path.slice(startDot, end);
            },
            format: function format(pathObject) {
              if (pathObject === null || typeof pathObject !== "object") {
                throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
              }
              return _format("/", pathObject);
            },
            parse: function parse2(path) {
              assertPath(path);
              var ret = { root: "", dir: "", base: "", ext: "", name: "" };
              if (path.length === 0)
                return ret;
              var code2 = path.charCodeAt(0);
              var isAbsolute = code2 === 47;
              var start;
              if (isAbsolute) {
                ret.root = "/";
                start = 1;
              } else {
                start = 0;
              }
              var startDot = -1;
              var startPart = 0;
              var end = -1;
              var matchedSlash = true;
              var i2 = path.length - 1;
              var preDotState = 0;
              for (; i2 >= start; --i2) {
                code2 = path.charCodeAt(i2);
                if (code2 === 47) {
                  if (!matchedSlash) {
                    startPart = i2 + 1;
                    break;
                  }
                  continue;
                }
                if (end === -1) {
                  matchedSlash = false;
                  end = i2 + 1;
                }
                if (code2 === 46) {
                  if (startDot === -1)
                    startDot = i2;
                  else if (preDotState !== 1)
                    preDotState = 1;
                } else if (startDot !== -1) {
                  preDotState = -1;
                }
              }
              if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
              preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
              preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
                if (end !== -1) {
                  if (startPart === 0 && isAbsolute)
                    ret.base = ret.name = path.slice(1, end);
                  else
                    ret.base = ret.name = path.slice(startPart, end);
                }
              } else {
                if (startPart === 0 && isAbsolute) {
                  ret.name = path.slice(1, startDot);
                  ret.base = path.slice(1, end);
                } else {
                  ret.name = path.slice(startPart, startDot);
                  ret.base = path.slice(startPart, end);
                }
                ret.ext = path.slice(startDot, end);
              }
              if (startPart > 0)
                ret.dir = path.slice(0, startPart - 1);
              else if (isAbsolute)
                ret.dir = "/";
              return ret;
            },
            sep: "/",
            delimiter: ":",
            win32: null,
            posix: null
          };
          posix.posix = posix;
          module.exports = posix;
        }
      )
      /******/
    };
    var __webpack_module_cache__ = {};
    function __webpack_require__(moduleId) {
      var cachedModule = __webpack_module_cache__[moduleId];
      if (cachedModule !== void 0) {
        return cachedModule.exports;
      }
      var module = __webpack_module_cache__[moduleId] = {
        /******/
        // no module.id needed
        /******/
        // no module.loaded needed
        /******/
        exports: {}
        /******/
      };
      __webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
      return module.exports;
    }
    (() => {
      __webpack_require__.n = (module) => {
        var getter = module && module.__esModule ? (
          /******/
          () => module["default"]
        ) : (
          /******/
          () => module
        );
        __webpack_require__.d(getter, { a: getter });
        return getter;
      };
    })();
    (() => {
      __webpack_require__.d = (exports, definition) => {
        for (var key in definition) {
          if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
            Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
          }
        }
      };
    })();
    (() => {
      __webpack_require__.g = function() {
        if (typeof globalThis === "object")
          return globalThis;
        try {
          return this || new Function("return this")();
        } catch (e) {
          if (typeof window === "object")
            return window;
        }
      }();
    })();
    (() => {
      __webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
    })();
    (() => {
      __webpack_require__.r = (exports) => {
        if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
          Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
        }
        Object.defineProperty(exports, "__esModule", { value: true });
      };
    })();
    var __webpack_exports__ = {};
    (() => {
      /*!*********************!*\
        !*** ./src/hook.ts ***!
        \*********************/
      __webpack_require__.r(__webpack_exports__);
      var _back_hook__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
        /*! @back/hook */
        "../app-backend-core/lib/hook.js"
      );
      var _vue_devtools_shared_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
        /*! @vue-devtools/shared-utils */
        "../shared-utils/lib/index.js"
      );
      (0, _back_hook__WEBPACK_IMPORTED_MODULE_0__.installHook)(_vue_devtools_shared_utils__WEBPACK_IMPORTED_MODULE_1__.target);
    })();
  })();
  (function() {
    var __webpack_modules__ = {
      /***/
      "../api/lib/esm/const.js": (
        /*!*******************************!*\
          !*** ../api/lib/esm/const.js ***!
          \*******************************/
        /***/
        (__unused_webpack_module, __webpack_exports__2, __webpack_require__2) => {
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            /* harmony export */
            "HOOK_PLUGIN_SETTINGS_SET": () => (
              /* binding */
              HOOK_PLUGIN_SETTINGS_SET
            ),
            /* harmony export */
            "HOOK_SETUP": () => (
              /* binding */
              HOOK_SETUP
            )
            /* harmony export */
          });
          const HOOK_SETUP = "devtools-plugin:setup";
          const HOOK_PLUGIN_SETTINGS_SET = "plugin:settings:set";
        }
      ),
      /***/
      "../api/lib/esm/env.js": (
        /*!*****************************!*\
          !*** ../api/lib/esm/env.js ***!
          \*****************************/
        /***/
        (__unused_webpack_module, __webpack_exports__2, __webpack_require__2) => {
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            /* harmony export */
            "getDevtoolsGlobalHook": () => (
              /* binding */
              getDevtoolsGlobalHook
            ),
            /* harmony export */
            "getTarget": () => (
              /* binding */
              getTarget2
            ),
            /* harmony export */
            "isProxyAvailable": () => (
              /* binding */
              isProxyAvailable
            )
            /* harmony export */
          });
          function getDevtoolsGlobalHook() {
            return getTarget2().__VUE_DEVTOOLS_GLOBAL_HOOK__;
          }
          function getTarget2() {
            return typeof navigator !== "undefined" && typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : typeof commonjsGlobal !== "undefined" ? commonjsGlobal : typeof my !== "undefined" ? my : {};
          }
          const isProxyAvailable = typeof Proxy === "function";
        }
      ),
      /***/
      "../api/lib/esm/index.js": (
        /*!*******************************!*\
          !*** ../api/lib/esm/index.js ***!
          \*******************************/
        /***/
        (__unused_webpack_module, __webpack_exports__2, __webpack_require__2) => {
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            /* harmony export */
            "isPerformanceSupported": () => (
              /* reexport safe */
              _time_js__WEBPACK_IMPORTED_MODULE_0__.isPerformanceSupported
            ),
            /* harmony export */
            "now": () => (
              /* reexport safe */
              _time_js__WEBPACK_IMPORTED_MODULE_0__.now
            ),
            /* harmony export */
            "setupDevtoolsPlugin": () => (
              /* binding */
              setupDevtoolsPlugin
            )
            /* harmony export */
          });
          var _env_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__2(
            /*! ./env.js */
            "../api/lib/esm/env.js"
          );
          var _const_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__2(
            /*! ./const.js */
            "../api/lib/esm/const.js"
          );
          var _proxy_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__2(
            /*! ./proxy.js */
            "../api/lib/esm/proxy.js"
          );
          var _time_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__2(
            /*! ./time.js */
            "../api/lib/esm/time.js"
          );
          function setupDevtoolsPlugin(pluginDescriptor, setupFn) {
            const descriptor = pluginDescriptor;
            const target = (0, _env_js__WEBPACK_IMPORTED_MODULE_1__.getTarget)();
            const hook = (0, _env_js__WEBPACK_IMPORTED_MODULE_1__.getDevtoolsGlobalHook)();
            const enableProxy = _env_js__WEBPACK_IMPORTED_MODULE_1__.isProxyAvailable && descriptor.enableEarlyProxy;
            if (hook && (target.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__ || !enableProxy)) {
              hook.emit(_const_js__WEBPACK_IMPORTED_MODULE_2__.HOOK_SETUP, pluginDescriptor, setupFn);
            } else {
              const proxy = enableProxy ? new _proxy_js__WEBPACK_IMPORTED_MODULE_3__.ApiProxy(descriptor, hook) : null;
              const list = target.__VUE_DEVTOOLS_PLUGINS__ = target.__VUE_DEVTOOLS_PLUGINS__ || [];
              list.push({
                pluginDescriptor: descriptor,
                setupFn,
                proxy
              });
              if (proxy)
                setupFn(proxy.proxiedTarget);
            }
          }
        }
      ),
      /***/
      "../api/lib/esm/proxy.js": (
        /*!*******************************!*\
          !*** ../api/lib/esm/proxy.js ***!
          \*******************************/
        /***/
        (__unused_webpack_module, __webpack_exports__2, __webpack_require__2) => {
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            /* harmony export */
            "ApiProxy": () => (
              /* binding */
              ApiProxy
            )
            /* harmony export */
          });
          var _const_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__2(
            /*! ./const.js */
            "../api/lib/esm/const.js"
          );
          var _time_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__2(
            /*! ./time.js */
            "../api/lib/esm/time.js"
          );
          class ApiProxy {
            constructor(plugin, hook) {
              this.target = null;
              this.targetQueue = [];
              this.onQueue = [];
              this.plugin = plugin;
              this.hook = hook;
              const defaultSettings = {};
              if (plugin.settings) {
                for (const id in plugin.settings) {
                  const item = plugin.settings[id];
                  defaultSettings[id] = item.defaultValue;
                }
              }
              const localSettingsSaveId = `__vue-devtools-plugin-settings__${plugin.id}`;
              let currentSettings = Object.assign({}, defaultSettings);
              try {
                const raw = localStorage.getItem(localSettingsSaveId);
                const data = JSON.parse(raw);
                Object.assign(currentSettings, data);
              } catch (e) {
              }
              this.fallbacks = {
                getSettings() {
                  return currentSettings;
                },
                setSettings(value) {
                  try {
                    localStorage.setItem(localSettingsSaveId, JSON.stringify(value));
                  } catch (e) {
                  }
                  currentSettings = value;
                },
                now() {
                  return (0, _time_js__WEBPACK_IMPORTED_MODULE_0__.now)();
                }
              };
              if (hook) {
                hook.on(_const_js__WEBPACK_IMPORTED_MODULE_1__.HOOK_PLUGIN_SETTINGS_SET, (pluginId, value) => {
                  if (pluginId === this.plugin.id) {
                    this.fallbacks.setSettings(value);
                  }
                });
              }
              this.proxiedOn = new Proxy({}, {
                get: (_target, prop) => {
                  if (this.target) {
                    return this.target.on[prop];
                  } else {
                    return (...args) => {
                      this.onQueue.push({
                        method: prop,
                        args
                      });
                    };
                  }
                }
              });
              this.proxiedTarget = new Proxy({}, {
                get: (_target, prop) => {
                  if (this.target) {
                    return this.target[prop];
                  } else if (prop === "on") {
                    return this.proxiedOn;
                  } else if (Object.keys(this.fallbacks).includes(prop)) {
                    return (...args) => {
                      this.targetQueue.push({
                        method: prop,
                        args,
                        resolve: () => {
                        }
                      });
                      return this.fallbacks[prop](...args);
                    };
                  } else {
                    return (...args) => {
                      return new Promise((resolve) => {
                        this.targetQueue.push({
                          method: prop,
                          args,
                          resolve
                        });
                      });
                    };
                  }
                }
              });
            }
            async setRealTarget(target) {
              this.target = target;
              for (const item of this.onQueue) {
                this.target.on[item.method](...item.args);
              }
              for (const item of this.targetQueue) {
                item.resolve(await this.target[item.method](...item.args));
              }
            }
          }
        }
      ),
      /***/
      "../api/lib/esm/time.js": (
        /*!******************************!*\
          !*** ../api/lib/esm/time.js ***!
          \******************************/
        /***/
        (__unused_webpack_module, __webpack_exports__2, __webpack_require__2) => {
          __webpack_require__2.r(__webpack_exports__2);
          __webpack_require__2.d(__webpack_exports__2, {
            /* harmony export */
            "isPerformanceSupported": () => (
              /* binding */
              isPerformanceSupported
            ),
            /* harmony export */
            "now": () => (
              /* binding */
              now
            )
            /* harmony export */
          });
          let supported;
          let perf;
          function isPerformanceSupported() {
            var _a;
            if (supported !== void 0) {
              return supported;
            }
            if (typeof window !== "undefined" && window.performance) {
              supported = true;
              perf = window.performance;
            } else if (typeof __webpack_require__2.g !== "undefined" && ((_a = __webpack_require__2.g.perf_hooks) === null || _a === void 0 ? void 0 : _a.performance)) {
              supported = true;
              perf = __webpack_require__2.g.perf_hooks.performance;
            } else {
              supported = false;
            }
            return supported;
          }
          function now() {
            return isPerformanceSupported() ? perf.now() : Date.now();
          }
        }
      ),
      /***/
      "../app-backend-api/lib/api.js": (
        /*!*************************************!*\
          !*** ../app-backend-api/lib/api.js ***!
          \*************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.DevtoolsPluginApiInstance = exports.DevtoolsApi = void 0;
          const shared_utils_1 = __webpack_require__2(
            /*! @vue-devtools/shared-utils */
            "../shared-utils/lib/index.js"
          );
          const devtools_api_1 = __webpack_require__2(
            /*! @vue/devtools-api */
            "../api/lib/esm/index.js"
          );
          const hooks_1 = __webpack_require__2(
            /*! ./hooks */
            "../app-backend-api/lib/hooks.js"
          );
          const pluginOn = [];
          class DevtoolsApi {
            constructor(backend, ctx) {
              this.stateEditor = new shared_utils_1.StateEditor();
              this.backend = backend;
              this.ctx = ctx;
              this.bridge = ctx.bridge;
              this.on = new hooks_1.DevtoolsHookable(ctx);
            }
            async callHook(eventType, payload, ctx = this.ctx) {
              payload = await this.on.callHandlers(eventType, payload, ctx);
              for (const on of pluginOn) {
                payload = await on.callHandlers(eventType, payload, ctx);
              }
              return payload;
            }
            async transformCall(callName, ...args) {
              const payload = await this.callHook(
                "transformCall",
                {
                  callName,
                  inArgs: args,
                  outArgs: args.slice()
                }
              );
              return payload.outArgs;
            }
            async getAppRecordName(app, defaultName) {
              const payload = await this.callHook(
                "getAppRecordName",
                {
                  app,
                  name: null
                }
              );
              if (payload.name) {
                return payload.name;
              } else {
                return `App ${defaultName}`;
              }
            }
            async getAppRootInstance(app) {
              const payload = await this.callHook(
                "getAppRootInstance",
                {
                  app,
                  root: null
                }
              );
              return payload.root;
            }
            async registerApplication(app) {
              await this.callHook(
                "registerApplication",
                {
                  app
                }
              );
            }
            async walkComponentTree(instance, maxDepth = -1, filter = null, recursively = false) {
              const payload = await this.callHook(
                "walkComponentTree",
                {
                  componentInstance: instance,
                  componentTreeData: null,
                  maxDepth,
                  filter,
                  recursively
                }
              );
              return payload.componentTreeData;
            }
            async visitComponentTree(instance, treeNode, filter = null, app) {
              const payload = await this.callHook(
                "visitComponentTree",
                {
                  app,
                  componentInstance: instance,
                  treeNode,
                  filter
                }
              );
              return payload.treeNode;
            }
            async walkComponentParents(instance) {
              const payload = await this.callHook(
                "walkComponentParents",
                {
                  componentInstance: instance,
                  parentInstances: []
                }
              );
              return payload.parentInstances;
            }
            async inspectComponent(instance, app) {
              const payload = await this.callHook(
                "inspectComponent",
                {
                  app,
                  componentInstance: instance,
                  instanceData: null
                }
              );
              return payload.instanceData;
            }
            async getComponentBounds(instance) {
              const payload = await this.callHook(
                "getComponentBounds",
                {
                  componentInstance: instance,
                  bounds: null
                }
              );
              return payload.bounds;
            }
            async getComponentName(instance) {
              const payload = await this.callHook(
                "getComponentName",
                {
                  componentInstance: instance,
                  name: null
                }
              );
              return payload.name;
            }
            async getComponentInstances(app) {
              const payload = await this.callHook(
                "getComponentInstances",
                {
                  app,
                  componentInstances: []
                }
              );
              return payload.componentInstances;
            }
            async getElementComponent(element) {
              const payload = await this.callHook(
                "getElementComponent",
                {
                  element,
                  componentInstance: null
                }
              );
              return payload.componentInstance;
            }
            async getComponentRootElements(instance) {
              const payload = await this.callHook(
                "getComponentRootElements",
                {
                  componentInstance: instance,
                  rootElements: []
                }
              );
              return payload.rootElements;
            }
            async editComponentState(instance, dotPath, type, state, app) {
              const arrayPath = dotPath.split(".");
              const payload = await this.callHook(
                "editComponentState",
                {
                  app,
                  componentInstance: instance,
                  path: arrayPath,
                  type,
                  state,
                  set: (object2, path = arrayPath, value = state.value, cb) => this.stateEditor.set(object2, path, value, cb || this.stateEditor.createDefaultSetCallback(state))
                }
              );
              return payload.componentInstance;
            }
            async getComponentDevtoolsOptions(instance) {
              const payload = await this.callHook(
                "getAppDevtoolsOptions",
                {
                  componentInstance: instance,
                  options: null
                }
              );
              return payload.options || {};
            }
            async getComponentRenderCode(instance) {
              const payload = await this.callHook(
                "getComponentRenderCode",
                {
                  componentInstance: instance,
                  code: null
                }
              );
              return {
                code: payload.code
              };
            }
            async inspectTimelineEvent(eventData, app) {
              const payload = await this.callHook(
                "inspectTimelineEvent",
                {
                  event: eventData.event,
                  layerId: eventData.layerId,
                  app,
                  data: eventData.event.data,
                  all: eventData.all
                }
              );
              return payload.data;
            }
            async clearTimeline() {
              await this.callHook(
                "timelineCleared",
                {}
              );
            }
            async getInspectorTree(inspectorId, app, filter) {
              const payload = await this.callHook(
                "getInspectorTree",
                {
                  inspectorId,
                  app,
                  filter,
                  rootNodes: []
                }
              );
              return payload.rootNodes;
            }
            async getInspectorState(inspectorId, app, nodeId) {
              const payload = await this.callHook(
                "getInspectorState",
                {
                  inspectorId,
                  app,
                  nodeId,
                  state: null
                }
              );
              return payload.state;
            }
            async editInspectorState(inspectorId, app, nodeId, dotPath, type, state) {
              const arrayPath = dotPath.split(".");
              await this.callHook(
                "editInspectorState",
                {
                  inspectorId,
                  app,
                  nodeId,
                  path: arrayPath,
                  type,
                  state,
                  set: (object2, path = arrayPath, value = state.value, cb) => this.stateEditor.set(object2, path, value, cb || this.stateEditor.createDefaultSetCallback(state))
                }
              );
            }
            now() {
              return (0, devtools_api_1.now)();
            }
          }
          exports.DevtoolsApi = DevtoolsApi;
          class DevtoolsPluginApiInstance {
            constructor(plugin, appRecord, ctx) {
              this.bridge = ctx.bridge;
              this.ctx = ctx;
              this.plugin = plugin;
              this.appRecord = appRecord;
              this.backendApi = appRecord.backend.api;
              this.defaultSettings = (0, shared_utils_1.getPluginDefaultSettings)(plugin.descriptor.settings);
              this.on = new hooks_1.DevtoolsHookable(ctx, plugin);
              pluginOn.push(this.on);
            }
            // Plugin API
            async notifyComponentUpdate(instance = null) {
              if (!this.enabled || !this.hasPermission(shared_utils_1.PluginPermission.COMPONENTS))
                return;
              if (instance) {
                this.ctx.hook.emit(shared_utils_1.HookEvents.COMPONENT_UPDATED, ...await this.backendApi.transformCall(shared_utils_1.HookEvents.COMPONENT_UPDATED, instance));
              } else {
                this.ctx.hook.emit(shared_utils_1.HookEvents.COMPONENT_UPDATED);
              }
            }
            addTimelineLayer(options) {
              if (!this.enabled || !this.hasPermission(shared_utils_1.PluginPermission.TIMELINE))
                return false;
              this.ctx.hook.emit(shared_utils_1.HookEvents.TIMELINE_LAYER_ADDED, options, this.plugin);
              return true;
            }
            addTimelineEvent(options) {
              if (!this.enabled || !this.hasPermission(shared_utils_1.PluginPermission.TIMELINE))
                return false;
              this.ctx.hook.emit(shared_utils_1.HookEvents.TIMELINE_EVENT_ADDED, options, this.plugin);
              return true;
            }
            addInspector(options) {
              if (!this.enabled || !this.hasPermission(shared_utils_1.PluginPermission.CUSTOM_INSPECTOR))
                return false;
              this.ctx.hook.emit(shared_utils_1.HookEvents.CUSTOM_INSPECTOR_ADD, options, this.plugin);
              return true;
            }
            sendInspectorTree(inspectorId) {
              if (!this.enabled || !this.hasPermission(shared_utils_1.PluginPermission.CUSTOM_INSPECTOR))
                return false;
              this.ctx.hook.emit(shared_utils_1.HookEvents.CUSTOM_INSPECTOR_SEND_TREE, inspectorId, this.plugin);
              return true;
            }
            sendInspectorState(inspectorId) {
              if (!this.enabled || !this.hasPermission(shared_utils_1.PluginPermission.CUSTOM_INSPECTOR))
                return false;
              this.ctx.hook.emit(shared_utils_1.HookEvents.CUSTOM_INSPECTOR_SEND_STATE, inspectorId, this.plugin);
              return true;
            }
            selectInspectorNode(inspectorId, nodeId) {
              if (!this.enabled || !this.hasPermission(shared_utils_1.PluginPermission.CUSTOM_INSPECTOR))
                return false;
              this.ctx.hook.emit(shared_utils_1.HookEvents.CUSTOM_INSPECTOR_SELECT_NODE, inspectorId, nodeId, this.plugin);
              return true;
            }
            getComponentBounds(instance) {
              return this.backendApi.getComponentBounds(instance);
            }
            getComponentName(instance) {
              return this.backendApi.getComponentName(instance);
            }
            getComponentInstances(app) {
              return this.backendApi.getComponentInstances(app);
            }
            highlightElement(instance) {
              if (!this.enabled || !this.hasPermission(shared_utils_1.PluginPermission.COMPONENTS))
                return false;
              this.ctx.hook.emit(shared_utils_1.HookEvents.COMPONENT_HIGHLIGHT, instance.__VUE_DEVTOOLS_UID__, this.plugin);
              return true;
            }
            unhighlightElement() {
              if (!this.enabled || !this.hasPermission(shared_utils_1.PluginPermission.COMPONENTS))
                return false;
              this.ctx.hook.emit(shared_utils_1.HookEvents.COMPONENT_UNHIGHLIGHT, this.plugin);
              return true;
            }
            getSettings(pluginId) {
              return (0, shared_utils_1.getPluginSettings)(pluginId !== null && pluginId !== void 0 ? pluginId : this.plugin.descriptor.id, this.defaultSettings);
            }
            setSettings(value, pluginId) {
              (0, shared_utils_1.setPluginSettings)(pluginId !== null && pluginId !== void 0 ? pluginId : this.plugin.descriptor.id, value);
            }
            now() {
              return (0, devtools_api_1.now)();
            }
            get enabled() {
              return (0, shared_utils_1.hasPluginPermission)(this.plugin.descriptor.id, shared_utils_1.PluginPermission.ENABLED);
            }
            hasPermission(permission) {
              return (0, shared_utils_1.hasPluginPermission)(this.plugin.descriptor.id, permission);
            }
          }
          exports.DevtoolsPluginApiInstance = DevtoolsPluginApiInstance;
        }
      ),
      /***/
      "../app-backend-api/lib/app-record.js": (
        /*!********************************************!*\
          !*** ../app-backend-api/lib/app-record.js ***!
          \********************************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
        }
      ),
      /***/
      "../app-backend-api/lib/backend-context.js": (
        /*!*************************************************!*\
          !*** ../app-backend-api/lib/backend-context.js ***!
          \*************************************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.createBackendContext = void 0;
          function createBackendContext(options) {
            return {
              bridge: options.bridge,
              hook: options.hook,
              backends: [],
              appRecords: [],
              currentTab: null,
              currentAppRecord: null,
              currentInspectedComponentId: null,
              plugins: [],
              currentPlugin: null,
              timelineLayers: [],
              nextTimelineEventId: 0,
              timelineEventMap: /* @__PURE__ */ new Map(),
              perfUniqueGroupId: 0,
              customInspectors: [],
              timelineMarkers: []
            };
          }
          exports.createBackendContext = createBackendContext;
        }
      ),
      /***/
      "../app-backend-api/lib/backend.js": (
        /*!*****************************************!*\
          !*** ../app-backend-api/lib/backend.js ***!
          \*****************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.createBackend = exports.defineBackend = exports.BuiltinBackendFeature = void 0;
          const api_1 = __webpack_require__2(
            /*! ./api */
            "../app-backend-api/lib/api.js"
          );
          (function(BuiltinBackendFeature) {
            BuiltinBackendFeature["FLUSH"] = "flush";
          })(exports.BuiltinBackendFeature || (exports.BuiltinBackendFeature = {}));
          function defineBackend(options) {
            return options;
          }
          exports.defineBackend = defineBackend;
          function createBackend(options, ctx) {
            const backend = {
              options,
              api: null
            };
            backend.api = new api_1.DevtoolsApi(backend, ctx);
            options.setup(backend.api);
            return backend;
          }
          exports.createBackend = createBackend;
        }
      ),
      /***/
      "../app-backend-api/lib/global-hook.js": (
        /*!*********************************************!*\
          !*** ../app-backend-api/lib/global-hook.js ***!
          \*********************************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
        }
      ),
      /***/
      "../app-backend-api/lib/hooks.js": (
        /*!***************************************!*\
          !*** ../app-backend-api/lib/hooks.js ***!
          \***************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.DevtoolsHookable = void 0;
          const shared_utils_1 = __webpack_require__2(
            /*! @vue-devtools/shared-utils */
            "../shared-utils/lib/index.js"
          );
          class DevtoolsHookable {
            constructor(ctx, plugin = null) {
              this.handlers = {};
              this.ctx = ctx;
              this.plugin = plugin;
            }
            hook(eventType, handler, pluginPermision = null) {
              const handlers = this.handlers[eventType] = this.handlers[eventType] || [];
              if (this.plugin) {
                const originalHandler = handler;
                handler = (...args) => {
                  var _a;
                  if (!(0, shared_utils_1.hasPluginPermission)(this.plugin.descriptor.id, shared_utils_1.PluginPermission.ENABLED) || pluginPermision && !(0, shared_utils_1.hasPluginPermission)(this.plugin.descriptor.id, pluginPermision))
                    return;
                  if (!this.plugin.descriptor.disableAppScope && ((_a = this.ctx.currentAppRecord) === null || _a === void 0 ? void 0 : _a.options.app) !== this.plugin.descriptor.app)
                    return;
                  if (!this.plugin.descriptor.disablePluginScope && args[0].pluginId != null && args[0].pluginId !== this.plugin.descriptor.id)
                    return;
                  return originalHandler(...args);
                };
              }
              handlers.push({
                handler,
                plugin: this.ctx.currentPlugin
              });
            }
            async callHandlers(eventType, payload, ctx) {
              if (this.handlers[eventType]) {
                const handlers = this.handlers[eventType];
                for (let i2 = 0; i2 < handlers.length; i2++) {
                  const {
                    handler,
                    plugin
                  } = handlers[i2];
                  try {
                    await handler(payload, ctx);
                  } catch (e) {
                    console.error(`An error occurred in hook '${eventType}'${plugin ? ` registered by plugin '${plugin.descriptor.id}'` : ""} with payload:`, payload);
                    console.error(e);
                  }
                }
              }
              return payload;
            }
            transformCall(handler) {
              this.hook(
                "transformCall",
                handler
              );
            }
            getAppRecordName(handler) {
              this.hook(
                "getAppRecordName",
                handler
              );
            }
            getAppRootInstance(handler) {
              this.hook(
                "getAppRootInstance",
                handler
              );
            }
            registerApplication(handler) {
              this.hook(
                "registerApplication",
                handler
              );
            }
            walkComponentTree(handler) {
              this.hook(
                "walkComponentTree",
                handler,
                shared_utils_1.PluginPermission.COMPONENTS
              );
            }
            visitComponentTree(handler) {
              this.hook(
                "visitComponentTree",
                handler,
                shared_utils_1.PluginPermission.COMPONENTS
              );
            }
            walkComponentParents(handler) {
              this.hook(
                "walkComponentParents",
                handler,
                shared_utils_1.PluginPermission.COMPONENTS
              );
            }
            inspectComponent(handler) {
              this.hook(
                "inspectComponent",
                handler,
                shared_utils_1.PluginPermission.COMPONENTS
              );
            }
            getComponentBounds(handler) {
              this.hook(
                "getComponentBounds",
                handler,
                shared_utils_1.PluginPermission.COMPONENTS
              );
            }
            getComponentName(handler) {
              this.hook(
                "getComponentName",
                handler,
                shared_utils_1.PluginPermission.COMPONENTS
              );
            }
            getComponentInstances(handler) {
              this.hook(
                "getComponentInstances",
                handler,
                shared_utils_1.PluginPermission.COMPONENTS
              );
            }
            getElementComponent(handler) {
              this.hook(
                "getElementComponent",
                handler,
                shared_utils_1.PluginPermission.COMPONENTS
              );
            }
            getComponentRootElements(handler) {
              this.hook(
                "getComponentRootElements",
                handler,
                shared_utils_1.PluginPermission.COMPONENTS
              );
            }
            editComponentState(handler) {
              this.hook(
                "editComponentState",
                handler,
                shared_utils_1.PluginPermission.COMPONENTS
              );
            }
            getComponentDevtoolsOptions(handler) {
              this.hook(
                "getAppDevtoolsOptions",
                handler,
                shared_utils_1.PluginPermission.COMPONENTS
              );
            }
            getComponentRenderCode(handler) {
              this.hook(
                "getComponentRenderCode",
                handler,
                shared_utils_1.PluginPermission.COMPONENTS
              );
            }
            inspectTimelineEvent(handler) {
              this.hook(
                "inspectTimelineEvent",
                handler,
                shared_utils_1.PluginPermission.TIMELINE
              );
            }
            timelineCleared(handler) {
              this.hook(
                "timelineCleared",
                handler,
                shared_utils_1.PluginPermission.TIMELINE
              );
            }
            getInspectorTree(handler) {
              this.hook(
                "getInspectorTree",
                handler,
                shared_utils_1.PluginPermission.CUSTOM_INSPECTOR
              );
            }
            getInspectorState(handler) {
              this.hook(
                "getInspectorState",
                handler,
                shared_utils_1.PluginPermission.CUSTOM_INSPECTOR
              );
            }
            editInspectorState(handler) {
              this.hook(
                "editInspectorState",
                handler,
                shared_utils_1.PluginPermission.CUSTOM_INSPECTOR
              );
            }
            setPluginSettings(handler) {
              this.hook(
                "setPluginSettings",
                handler
              );
            }
          }
          exports.DevtoolsHookable = DevtoolsHookable;
        }
      ),
      /***/
      "../app-backend-api/lib/index.js": (
        /*!***************************************!*\
          !*** ../app-backend-api/lib/index.js ***!
          \***************************************/
        /***/
        function(__unused_webpack_module, exports, __webpack_require__2) {
          var __createBinding = this && this.__createBinding || (Object.create ? function(o2, m2, k2, k22) {
            if (k22 === void 0)
              k22 = k2;
            var desc = Object.getOwnPropertyDescriptor(m2, k2);
            if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
              desc = {
                enumerable: true,
                get: function() {
                  return m2[k2];
                }
              };
            }
            Object.defineProperty(o2, k22, desc);
          } : function(o2, m2, k2, k22) {
            if (k22 === void 0)
              k22 = k2;
            o2[k22] = m2[k2];
          });
          var __exportStar = this && this.__exportStar || function(m2, exports2) {
            for (var p2 in m2)
              if (p2 !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p2))
                __createBinding(exports2, m2, p2);
          };
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          __exportStar(__webpack_require__2(
            /*! ./api */
            "../app-backend-api/lib/api.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./app-record */
            "../app-backend-api/lib/app-record.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./backend */
            "../app-backend-api/lib/backend.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./backend-context */
            "../app-backend-api/lib/backend-context.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./global-hook */
            "../app-backend-api/lib/global-hook.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./hooks */
            "../app-backend-api/lib/hooks.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./plugin */
            "../app-backend-api/lib/plugin.js"
          ), exports);
        }
      ),
      /***/
      "../app-backend-api/lib/plugin.js": (
        /*!****************************************!*\
          !*** ../app-backend-api/lib/plugin.js ***!
          \****************************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
        }
      ),
      /***/
      "../app-backend-core/lib/app.js": (
        /*!**************************************!*\
          !*** ../app-backend-core/lib/app.js ***!
          \**************************************/
        /***/
        function(__unused_webpack_module, exports, __webpack_require__2) {
          var __importDefault = this && this.__importDefault || function(mod) {
            return mod && mod.__esModule ? mod : {
              "default": mod
            };
          };
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports._legacy_getAndRegisterApps = exports.removeApp = exports.sendApps = exports.waitForAppsRegistration = exports.getAppRecord = exports.getAppRecordId = exports.mapAppRecord = exports.selectApp = exports.registerApp = void 0;
          const shared_utils_1 = __webpack_require__2(
            /*! @vue-devtools/shared-utils */
            "../shared-utils/lib/index.js"
          );
          const speakingurl_1 = __importDefault(__webpack_require__2(
            /*! speakingurl */
            "../../node_modules/speakingurl/index.js"
          ));
          const queue_1 = __webpack_require__2(
            /*! ./util/queue */
            "../app-backend-core/lib/util/queue.js"
          );
          const scan_1 = __webpack_require__2(
            /*! ./legacy/scan */
            "../app-backend-core/lib/legacy/scan.js"
          );
          const timeline_1 = __webpack_require__2(
            /*! ./timeline */
            "../app-backend-core/lib/timeline.js"
          );
          const backend_1 = __webpack_require__2(
            /*! ./backend */
            "../app-backend-core/lib/backend.js"
          );
          const global_hook_js_1 = __webpack_require__2(
            /*! ./global-hook.js */
            "../app-backend-core/lib/global-hook.js"
          );
          const jobs = new queue_1.JobQueue();
          let recordId = 0;
          const appRecordPromises = /* @__PURE__ */ new Map();
          async function registerApp(options, ctx) {
            return jobs.queue("regiserApp", () => registerAppJob(options, ctx));
          }
          exports.registerApp = registerApp;
          async function registerAppJob(options, ctx) {
            if (ctx.appRecords.find((a2) => a2.options.app === options.app)) {
              return;
            }
            if (!options.version) {
              throw new Error("[Vue Devtools] Vue version not found");
            }
            const baseFrameworkVersion = parseInt(options.version.substring(0, options.version.indexOf(".")));
            for (let i2 = 0; i2 < backend_1.availableBackends.length; i2++) {
              const backendOptions = backend_1.availableBackends[i2];
              if (backendOptions.frameworkVersion === baseFrameworkVersion) {
                const backend = (0, backend_1.getBackend)(backendOptions, ctx);
                await createAppRecord(options, backend, ctx);
                break;
              }
            }
          }
          async function createAppRecord(options, backend, ctx) {
            var _a, _b, _c;
            const rootInstance = await backend.api.getAppRootInstance(options.app);
            if (rootInstance) {
              if ((await backend.api.getComponentDevtoolsOptions(rootInstance)).hide) {
                options.app._vueDevtools_hidden_ = true;
                return;
              }
              recordId++;
              const name = await backend.api.getAppRecordName(options.app, recordId.toString());
              const id = getAppRecordId(options.app, (0, speakingurl_1.default)(name));
              const [el] = await backend.api.getComponentRootElements(rootInstance);
              const record = {
                id,
                name,
                options,
                backend,
                lastInspectedComponentId: null,
                instanceMap: /* @__PURE__ */ new Map(),
                rootInstance,
                perfGroupIds: /* @__PURE__ */ new Map(),
                iframe: shared_utils_1.isBrowser && el && document !== el.ownerDocument ? (_b = (_a = el.ownerDocument) === null || _a === void 0 ? void 0 : _a.location) === null || _b === void 0 ? void 0 : _b.pathname : null,
                meta: (_c = options.meta) !== null && _c !== void 0 ? _c : {}
              };
              options.app.__VUE_DEVTOOLS_APP_RECORD__ = record;
              const rootId = `${record.id}:root`;
              record.instanceMap.set(rootId, record.rootInstance);
              record.rootInstance.__VUE_DEVTOOLS_UID__ = rootId;
              (0, timeline_1.addBuiltinLayers)(record, ctx);
              ctx.appRecords.push(record);
              if (backend.options.setupApp) {
                backend.options.setupApp(backend.api, record);
              }
              await backend.api.registerApplication(options.app);
              ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_APP_ADD, {
                appRecord: mapAppRecord(record)
              });
              if (appRecordPromises.has(options.app)) {
                for (const r2 of appRecordPromises.get(options.app)) {
                  await r2(record);
                }
              }
              if (ctx.currentAppRecord == null) {
                await selectApp(record, ctx);
              }
            } else if (shared_utils_1.SharedData.debugInfo) {
              console.warn("[Vue devtools] No root instance found for app, it might have been unmounted", options.app);
            }
          }
          async function selectApp(record, ctx) {
            ctx.currentAppRecord = record;
            ctx.currentInspectedComponentId = record.lastInspectedComponentId;
            ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_APP_SELECTED, {
              id: record.id,
              lastInspectedComponentId: record.lastInspectedComponentId
            });
          }
          exports.selectApp = selectApp;
          function mapAppRecord(record) {
            return {
              id: record.id,
              name: record.name,
              version: record.options.version,
              iframe: record.iframe
            };
          }
          exports.mapAppRecord = mapAppRecord;
          const appIds = /* @__PURE__ */ new Set();
          function getAppRecordId(app, defaultId) {
            if (app.__VUE_DEVTOOLS_APP_RECORD_ID__ != null) {
              return app.__VUE_DEVTOOLS_APP_RECORD_ID__;
            }
            let id = defaultId !== null && defaultId !== void 0 ? defaultId : (recordId++).toString();
            if (defaultId && appIds.has(id)) {
              let count = 1;
              while (appIds.has(`${defaultId}_${count}`)) {
                count++;
              }
              id = `${defaultId}_${count}`;
            }
            appIds.add(id);
            app.__VUE_DEVTOOLS_APP_RECORD_ID__ = id;
            return id;
          }
          exports.getAppRecordId = getAppRecordId;
          async function getAppRecord(app, ctx) {
            var _a;
            const record = (_a = app.__VUE_DEVTOOLS_APP_RECORD__) !== null && _a !== void 0 ? _a : ctx.appRecords.find((ar) => ar.options.app === app);
            if (record) {
              return record;
            }
            if (app._vueDevtools_hidden_)
              return null;
            return new Promise((resolve, reject) => {
              let resolvers = appRecordPromises.get(app);
              let timedOut = false;
              if (!resolvers) {
                resolvers = [];
                appRecordPromises.set(app, resolvers);
              }
              const fn = (record2) => {
                if (!timedOut) {
                  clearTimeout(timer);
                  resolve(record2);
                }
              };
              resolvers.push(fn);
              const timer = setTimeout(() => {
                timedOut = true;
                const index2 = resolvers.indexOf(fn);
                if (index2 !== -1)
                  resolvers.splice(index2, 1);
                if (shared_utils_1.SharedData.debugInfo) {
                  console.log("Timed out waiting for app record", app);
                }
                reject(new Error(`Timed out getting app record for app`));
              }, 6e4);
            });
          }
          exports.getAppRecord = getAppRecord;
          function waitForAppsRegistration() {
            return jobs.queue("waitForAppsRegistrationNoop", async () => {
            });
          }
          exports.waitForAppsRegistration = waitForAppsRegistration;
          async function sendApps(ctx) {
            const appRecords = [];
            for (const appRecord of ctx.appRecords) {
              appRecords.push(appRecord);
            }
            ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_APP_LIST, {
              apps: appRecords.map(mapAppRecord)
            });
          }
          exports.sendApps = sendApps;
          function removeAppRecord(appRecord, ctx) {
            try {
              appIds.delete(appRecord.id);
              const index2 = ctx.appRecords.indexOf(appRecord);
              if (index2 !== -1)
                ctx.appRecords.splice(index2, 1);
              (0, timeline_1.removeLayersForApp)(appRecord.options.app, ctx);
              ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_APP_REMOVE, {
                id: appRecord.id
              });
            } catch (e) {
              if (shared_utils_1.SharedData.debugInfo) {
                console.error(e);
              }
            }
          }
          async function removeApp(app, ctx) {
            try {
              const appRecord = await getAppRecord(app, ctx);
              if (appRecord) {
                removeAppRecord(appRecord, ctx);
              }
            } catch (e) {
              if (shared_utils_1.SharedData.debugInfo) {
                console.error(e);
              }
            }
          }
          exports.removeApp = removeApp;
          let scanTimeout;
          function _legacy_getAndRegisterApps(ctx, clear = false) {
            setTimeout(() => {
              try {
                if (clear) {
                  ctx.appRecords.forEach((appRecord) => {
                    if (appRecord.meta.Vue) {
                      removeAppRecord(appRecord, ctx);
                    }
                  });
                }
                const apps = (0, scan_1.scan)();
                clearTimeout(scanTimeout);
                if (!apps.length) {
                  scanTimeout = setTimeout(() => _legacy_getAndRegisterApps(ctx), 1e3);
                }
                apps.forEach((app) => {
                  const Vue2 = global_hook_js_1.hook.Vue;
                  registerApp({
                    app,
                    types: {},
                    version: Vue2 === null || Vue2 === void 0 ? void 0 : Vue2.version,
                    meta: {
                      Vue: Vue2
                    }
                  }, ctx);
                });
              } catch (e) {
                console.error(`Error scanning for legacy apps:`);
                console.error(e);
              }
            }, 0);
          }
          exports._legacy_getAndRegisterApps = _legacy_getAndRegisterApps;
        }
      ),
      /***/
      "../app-backend-core/lib/backend.js": (
        /*!******************************************!*\
          !*** ../app-backend-core/lib/backend.js ***!
          \******************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.getBackend = exports.availableBackends = void 0;
          const app_backend_api_1 = __webpack_require__2(
            /*! @vue-devtools/app-backend-api */
            "../app-backend-api/lib/index.js"
          );
          const app_backend_vue3_1 = __webpack_require__2(
            /*! @vue-devtools/app-backend-vue3 */
            "../app-backend-vue3/lib/index.js"
          );
          const perf_1 = __webpack_require__2(
            /*! ./perf */
            "../app-backend-core/lib/perf.js"
          );
          exports.availableBackends = [
            // backendVue1,
            // backendVue2,
            app_backend_vue3_1.backend
          ];
          const enabledBackends = /* @__PURE__ */ new Map();
          function getBackend(backendOptions, ctx) {
            let backend;
            if (!enabledBackends.has(backendOptions)) {
              backend = (0, app_backend_api_1.createBackend)(backendOptions, ctx);
              (0, perf_1.handleAddPerformanceTag)(backend, ctx);
              enabledBackends.set(backendOptions, backend);
              ctx.backends.push(backend);
            } else {
              backend = enabledBackends.get(backendOptions);
            }
            return backend;
          }
          exports.getBackend = getBackend;
        }
      ),
      /***/
      "../app-backend-core/lib/component-pick.js": (
        /*!*************************************************!*\
          !*** ../app-backend-core/lib/component-pick.js ***!
          \*************************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          const shared_utils_1 = __webpack_require__2(
            /*! @vue-devtools/shared-utils */
            "../shared-utils/lib/index.js"
          );
          const highlighter_1 = __webpack_require__2(
            /*! ./highlighter */
            "../app-backend-core/lib/highlighter.js"
          );
          class ComponentPicker {
            constructor(ctx) {
              this.ctx = ctx;
              this.bindMethods();
            }
            /**
             * Adds event listeners for mouseover and mouseup
             */
            startSelecting() {
              if (!shared_utils_1.isBrowser)
                return;
              window.addEventListener("mouseover", this.elementMouseOver, true);
              window.addEventListener("click", this.elementClicked, true);
              window.addEventListener("mouseout", this.cancelEvent, true);
              window.addEventListener("mouseenter", this.cancelEvent, true);
              window.addEventListener("mouseleave", this.cancelEvent, true);
              window.addEventListener("mousedown", this.cancelEvent, true);
              window.addEventListener("mouseup", this.cancelEvent, true);
            }
            /**
             * Removes event listeners
             */
            stopSelecting() {
              if (!shared_utils_1.isBrowser)
                return;
              window.removeEventListener("mouseover", this.elementMouseOver, true);
              window.removeEventListener("click", this.elementClicked, true);
              window.removeEventListener("mouseout", this.cancelEvent, true);
              window.removeEventListener("mouseenter", this.cancelEvent, true);
              window.removeEventListener("mouseleave", this.cancelEvent, true);
              window.removeEventListener("mousedown", this.cancelEvent, true);
              window.removeEventListener("mouseup", this.cancelEvent, true);
              (0, highlighter_1.unHighlight)();
            }
            /**
             * Highlights a component on element mouse over
             */
            async elementMouseOver(e) {
              this.cancelEvent(e);
              const el = e.target;
              if (el) {
                await this.selectElementComponent(el);
              }
              (0, highlighter_1.unHighlight)();
              if (this.selectedInstance) {
                (0, highlighter_1.highlight)(this.selectedInstance, this.selectedBackend, this.ctx);
              }
            }
            async selectElementComponent(el) {
              for (const backend of this.ctx.backends) {
                const instance = await backend.api.getElementComponent(el);
                if (instance) {
                  this.selectedInstance = instance;
                  this.selectedBackend = backend;
                  return;
                }
              }
              this.selectedInstance = null;
              this.selectedBackend = null;
            }
            /**
             * Selects an instance in the component view
             */
            async elementClicked(e) {
              this.cancelEvent(e);
              if (this.selectedInstance && this.selectedBackend) {
                const parentInstances = await this.selectedBackend.api.walkComponentParents(this.selectedInstance);
                this.ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_COMPONENT_PICK, {
                  id: this.selectedInstance.__VUE_DEVTOOLS_UID__,
                  parentIds: parentInstances.map((i2) => i2.__VUE_DEVTOOLS_UID__)
                });
              } else {
                this.ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_COMPONENT_PICK_CANCELED, null);
              }
              this.stopSelecting();
            }
            /**
             * Cancel a mouse event
             */
            cancelEvent(e) {
              e.stopImmediatePropagation();
              e.preventDefault();
            }
            /**
             * Bind class methods to the class scope to avoid rebind for event listeners
             */
            bindMethods() {
              this.startSelecting = this.startSelecting.bind(this);
              this.stopSelecting = this.stopSelecting.bind(this);
              this.elementMouseOver = this.elementMouseOver.bind(this);
              this.elementClicked = this.elementClicked.bind(this);
            }
          }
          exports["default"] = ComponentPicker;
        }
      ),
      /***/
      "../app-backend-core/lib/component.js": (
        /*!********************************************!*\
          !*** ../app-backend-core/lib/component.js ***!
          \********************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.sendComponentUpdateTracking = exports.refreshComponentTreeSearch = exports.getComponentInstance = exports.getComponentId = exports.editComponentState = exports.sendEmptyComponentData = exports.markSelectedInstance = exports.sendSelectedComponentData = exports.sendComponentTreeData = void 0;
          const shared_utils_1 = __webpack_require__2(
            /*! @vue-devtools/shared-utils */
            "../shared-utils/lib/index.js"
          );
          const app_backend_api_1 = __webpack_require__2(
            /*! @vue-devtools/app-backend-api */
            "../app-backend-api/lib/index.js"
          );
          const app_1 = __webpack_require__2(
            /*! ./app */
            "../app-backend-core/lib/app.js"
          );
          const MAX_$VM = 10;
          const $vmQueue = [];
          async function sendComponentTreeData(appRecord, instanceId, filter = "", maxDepth = null, recursively = false, ctx) {
            if (!instanceId || appRecord !== ctx.currentAppRecord)
              return;
            if (instanceId !== "_root" && ctx.currentAppRecord.backend.options.features.includes(app_backend_api_1.BuiltinBackendFeature.FLUSH)) {
              return;
            }
            const instance = getComponentInstance(appRecord, instanceId);
            if (!instance) {
              ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_COMPONENT_TREE, {
                instanceId,
                treeData: null,
                notFound: true
              });
            } else {
              if (filter)
                filter = filter.toLowerCase();
              if (maxDepth == null) {
                maxDepth = instance === ctx.currentAppRecord.rootInstance ? 2 : 1;
              }
              const data = await appRecord.backend.api.walkComponentTree(instance, maxDepth, filter, recursively);
              const payload = {
                instanceId,
                treeData: (0, shared_utils_1.stringify)(data)
              };
              ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_COMPONENT_TREE, payload);
            }
          }
          exports.sendComponentTreeData = sendComponentTreeData;
          async function sendSelectedComponentData(appRecord, instanceId, ctx) {
            if (!instanceId || appRecord !== ctx.currentAppRecord)
              return;
            const instance = getComponentInstance(appRecord, instanceId);
            if (!instance) {
              sendEmptyComponentData(instanceId, ctx);
            } else {
              if (typeof window !== "undefined") {
                const win = window;
                win.$vm = instance;
                if ($vmQueue[0] !== instance) {
                  if ($vmQueue.length >= MAX_$VM) {
                    $vmQueue.pop();
                  }
                  for (let i2 = $vmQueue.length; i2 > 0; i2--) {
                    win[`$vm${i2}`] = $vmQueue[i2] = $vmQueue[i2 - 1];
                  }
                  win.$vm0 = $vmQueue[0] = instance;
                }
              }
              if (shared_utils_1.SharedData.debugInfo) {
                console.log("[DEBUG] inspect", instance);
              }
              const parentInstances = await appRecord.backend.api.walkComponentParents(instance);
              const payload = {
                instanceId,
                data: await appRecord.backend.api.inspectComponent(instance, ctx.currentAppRecord.options.app),
                parentIds: parentInstances.map((i2) => i2.__VUE_DEVTOOLS_UID__)
              };
              {
                payload.data.isSetup = !!instance.type.setup && !instance.type.render;
              }
              payload.data = (0, shared_utils_1.stringify)(payload.data);
              ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_COMPONENT_SELECTED_DATA, payload);
              markSelectedInstance(instanceId, ctx);
            }
          }
          exports.sendSelectedComponentData = sendSelectedComponentData;
          function markSelectedInstance(instanceId, ctx) {
            ctx.currentInspectedComponentId = instanceId;
            ctx.currentAppRecord.lastInspectedComponentId = instanceId;
          }
          exports.markSelectedInstance = markSelectedInstance;
          function sendEmptyComponentData(instanceId, ctx) {
            ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_COMPONENT_SELECTED_DATA, {
              instanceId,
              data: null
            });
          }
          exports.sendEmptyComponentData = sendEmptyComponentData;
          async function editComponentState(instanceId, dotPath, type, state, ctx) {
            if (!instanceId)
              return;
            const instance = getComponentInstance(ctx.currentAppRecord, instanceId);
            if (instance) {
              if ("value" in state && state.value != null) {
                state.value = (0, shared_utils_1.parse)(state.value, true);
              }
              await ctx.currentAppRecord.backend.api.editComponentState(instance, dotPath, type, state, ctx.currentAppRecord.options.app);
              await sendSelectedComponentData(ctx.currentAppRecord, instanceId, ctx);
            }
          }
          exports.editComponentState = editComponentState;
          async function getComponentId(app, uid, instance, ctx) {
            try {
              if (instance.__VUE_DEVTOOLS_UID__)
                return instance.__VUE_DEVTOOLS_UID__;
              const appRecord = await (0, app_1.getAppRecord)(app, ctx);
              if (!appRecord)
                return null;
              const isRoot = appRecord.rootInstance === instance;
              return `${appRecord.id}:${isRoot ? "root" : uid}`;
            } catch (e) {
              if (shared_utils_1.SharedData.debugInfo) {
                console.error(e);
              }
              return null;
            }
          }
          exports.getComponentId = getComponentId;
          function getComponentInstance(appRecord, instanceId, ctx) {
            if (instanceId === "_root") {
              instanceId = `${appRecord.id}:root`;
            }
            const instance = appRecord.instanceMap.get(instanceId);
            if (!instance && shared_utils_1.SharedData.debugInfo) {
              console.warn(`Instance uid=${instanceId} not found`);
            }
            return instance;
          }
          exports.getComponentInstance = getComponentInstance;
          async function refreshComponentTreeSearch(ctx) {
            if (!ctx.currentAppRecord.componentFilter)
              return;
            await sendComponentTreeData(ctx.currentAppRecord, "_root", ctx.currentAppRecord.componentFilter, null, false, ctx);
          }
          exports.refreshComponentTreeSearch = refreshComponentTreeSearch;
          async function sendComponentUpdateTracking(instanceId, ctx) {
            if (!instanceId)
              return;
            const payload = {
              instanceId,
              time: Date.now()
              // Use normal date
            };
            ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_COMPONENT_UPDATED, payload);
          }
          exports.sendComponentUpdateTracking = sendComponentUpdateTracking;
        }
      ),
      /***/
      "../app-backend-core/lib/flash.js": (
        /*!****************************************!*\
          !*** ../app-backend-core/lib/flash.js ***!
          \****************************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.flashComponent = void 0;
          async function flashComponent(instance, backend) {
            const bounds = await backend.api.getComponentBounds(instance);
            if (bounds) {
              let overlay = instance.__VUE_DEVTOOLS_FLASH;
              if (!overlay) {
                overlay = document.createElement("div");
                instance.__VUE_DEVTOOLS_FLASH = overlay;
                overlay.style.border = "2px rgba(65, 184, 131, 0.7) solid";
                overlay.style.position = "fixed";
                overlay.style.zIndex = "99999999999998";
                overlay.style.pointerEvents = "none";
                overlay.style.borderRadius = "3px";
                overlay.style.boxSizing = "border-box";
                document.body.appendChild(overlay);
              }
              overlay.style.opacity = "1";
              overlay.style.transition = null;
              overlay.style.width = Math.round(bounds.width) + "px";
              overlay.style.height = Math.round(bounds.height) + "px";
              overlay.style.left = Math.round(bounds.left) + "px";
              overlay.style.top = Math.round(bounds.top) + "px";
              requestAnimationFrame(() => {
                overlay.style.transition = "opacity 1s";
                overlay.style.opacity = "0";
              });
              clearTimeout(overlay._timer);
              overlay._timer = setTimeout(() => {
                document.body.removeChild(overlay);
                instance.__VUE_DEVTOOLS_FLASH = null;
              }, 1e3);
            }
          }
          exports.flashComponent = flashComponent;
        }
      ),
      /***/
      "../app-backend-core/lib/global-hook.js": (
        /*!**********************************************!*\
          !*** ../app-backend-core/lib/global-hook.js ***!
          \**********************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.hook = void 0;
          const shared_utils_1 = __webpack_require__2(
            /*! @vue-devtools/shared-utils */
            "../shared-utils/lib/index.js"
          );
          exports.hook = shared_utils_1.target.__VUE_DEVTOOLS_GLOBAL_HOOK__;
        }
      ),
      /***/
      "../app-backend-core/lib/highlighter.js": (
        /*!**********************************************!*\
          !*** ../app-backend-core/lib/highlighter.js ***!
          \**********************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.unHighlight = exports.highlight = void 0;
          const shared_utils_1 = __webpack_require__2(
            /*! @vue-devtools/shared-utils */
            "../shared-utils/lib/index.js"
          );
          const queue_1 = __webpack_require__2(
            /*! ./util/queue */
            "../app-backend-core/lib/util/queue.js"
          );
          let overlay;
          let overlayContent;
          let currentInstance;
          function createOverlay() {
            if (overlay || !shared_utils_1.isBrowser)
              return;
            overlay = document.createElement("div");
            overlay.style.backgroundColor = "rgba(65, 184, 131, 0.35)";
            overlay.style.position = "fixed";
            overlay.style.zIndex = "99999999999998";
            overlay.style.pointerEvents = "none";
            overlay.style.borderRadius = "3px";
            overlayContent = document.createElement("div");
            overlayContent.style.position = "fixed";
            overlayContent.style.zIndex = "99999999999999";
            overlayContent.style.pointerEvents = "none";
            overlayContent.style.backgroundColor = "white";
            overlayContent.style.fontFamily = "monospace";
            overlayContent.style.fontSize = "11px";
            overlayContent.style.padding = "4px 8px";
            overlayContent.style.borderRadius = "3px";
            overlayContent.style.color = "#333";
            overlayContent.style.textAlign = "center";
            overlayContent.style.border = "rgba(65, 184, 131, 0.5) 1px solid";
            overlayContent.style.backgroundClip = "padding-box";
          }
          const jobQueue = new queue_1.JobQueue();
          async function highlight(instance, backend, ctx) {
            await jobQueue.queue("highlight", async () => {
              if (!instance)
                return;
              const bounds = await backend.api.getComponentBounds(instance);
              if (bounds) {
                createOverlay();
                const name = await backend.api.getComponentName(instance) || "Anonymous";
                const pre = document.createElement("span");
                pre.style.opacity = "0.6";
                pre.innerText = "<";
                const text = document.createElement("span");
                text.style.fontWeight = "bold";
                text.style.color = "#09ab56";
                text.innerText = name;
                const post = document.createElement("span");
                post.style.opacity = "0.6";
                post.innerText = ">";
                const size = document.createElement("span");
                size.style.opacity = "0.5";
                size.style.marginLeft = "6px";
                size.appendChild(document.createTextNode((Math.round(bounds.width * 100) / 100).toString()));
                const multiply = document.createElement("span");
                multiply.style.marginLeft = multiply.style.marginRight = "2px";
                multiply.innerText = "×";
                size.appendChild(multiply);
                size.appendChild(document.createTextNode((Math.round(bounds.height * 100) / 100).toString()));
                currentInstance = instance;
                await showOverlay(bounds, [pre, text, post, size]);
              }
              startUpdateTimer(backend);
            });
          }
          exports.highlight = highlight;
          async function unHighlight() {
            await jobQueue.queue("unHighlight", async () => {
              var _a, _b;
              (_a = overlay === null || overlay === void 0 ? void 0 : overlay.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(overlay);
              (_b = overlayContent === null || overlayContent === void 0 ? void 0 : overlayContent.parentNode) === null || _b === void 0 ? void 0 : _b.removeChild(overlayContent);
              currentInstance = null;
              stopUpdateTimer();
            });
          }
          exports.unHighlight = unHighlight;
          function showOverlay(bounds, children = null) {
            if (!shared_utils_1.isBrowser || !children.length)
              return;
            positionOverlay(bounds);
            document.body.appendChild(overlay);
            overlayContent.innerHTML = "";
            children.forEach((child) => overlayContent.appendChild(child));
            document.body.appendChild(overlayContent);
            positionOverlayContent(bounds);
          }
          function positionOverlay({
            width = 0,
            height = 0,
            top = 0,
            left = 0
          }) {
            overlay.style.width = Math.round(width) + "px";
            overlay.style.height = Math.round(height) + "px";
            overlay.style.left = Math.round(left) + "px";
            overlay.style.top = Math.round(top) + "px";
          }
          function positionOverlayContent({
            height = 0,
            top = 0,
            left = 0
          }) {
            const contentWidth = overlayContent.offsetWidth;
            const contentHeight = overlayContent.offsetHeight;
            let contentLeft = left;
            if (contentLeft < 0) {
              contentLeft = 0;
            } else if (contentLeft + contentWidth > window.innerWidth) {
              contentLeft = window.innerWidth - contentWidth;
            }
            let contentTop = top - contentHeight - 2;
            if (contentTop < 0) {
              contentTop = top + height + 2;
            }
            if (contentTop < 0) {
              contentTop = 0;
            } else if (contentTop + contentHeight > window.innerHeight) {
              contentTop = window.innerHeight - contentHeight;
            }
            overlayContent.style.left = ~~contentLeft + "px";
            overlayContent.style.top = ~~contentTop + "px";
          }
          async function updateOverlay(backend, ctx) {
            if (currentInstance) {
              const bounds = await backend.api.getComponentBounds(currentInstance);
              if (bounds) {
                const sizeEl = overlayContent.children.item(3);
                const widthEl = sizeEl.childNodes[0];
                widthEl.textContent = (Math.round(bounds.width * 100) / 100).toString();
                const heightEl = sizeEl.childNodes[2];
                heightEl.textContent = (Math.round(bounds.height * 100) / 100).toString();
                positionOverlay(bounds);
                positionOverlayContent(bounds);
              }
            }
          }
          let updateTimer;
          function startUpdateTimer(backend, ctx) {
            stopUpdateTimer();
            updateTimer = setInterval(() => {
              jobQueue.queue("updateOverlay", async () => {
                await updateOverlay(backend);
              });
            }, 1e3 / 30);
          }
          function stopUpdateTimer() {
            clearInterval(updateTimer);
          }
        }
      ),
      /***/
      "../app-backend-core/lib/index.js": (
        /*!****************************************!*\
          !*** ../app-backend-core/lib/index.js ***!
          \****************************************/
        /***/
        function(__unused_webpack_module, exports, __webpack_require__2) {
          var __importDefault = this && this.__importDefault || function(mod) {
            return mod && mod.__esModule ? mod : {
              "default": mod
            };
          };
          var _a, _b;
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.initBackend = void 0;
          const app_backend_api_1 = __webpack_require__2(
            /*! @vue-devtools/app-backend-api */
            "../app-backend-api/lib/index.js"
          );
          const shared_utils_1 = __webpack_require__2(
            /*! @vue-devtools/shared-utils */
            "../shared-utils/lib/index.js"
          );
          const debounce_1 = __importDefault(__webpack_require__2(
            /*! lodash/debounce */
            "../../node_modules/lodash/debounce.js"
          ));
          const throttle_1 = __importDefault(__webpack_require__2(
            /*! lodash/throttle */
            "../../node_modules/lodash/throttle.js"
          ));
          const global_hook_1 = __webpack_require__2(
            /*! ./global-hook */
            "../app-backend-core/lib/global-hook.js"
          );
          const subscriptions_1 = __webpack_require__2(
            /*! ./util/subscriptions */
            "../app-backend-core/lib/util/subscriptions.js"
          );
          const highlighter_1 = __webpack_require__2(
            /*! ./highlighter */
            "../app-backend-core/lib/highlighter.js"
          );
          const timeline_1 = __webpack_require__2(
            /*! ./timeline */
            "../app-backend-core/lib/timeline.js"
          );
          const component_pick_1 = __importDefault(__webpack_require__2(
            /*! ./component-pick */
            "../app-backend-core/lib/component-pick.js"
          ));
          const component_1 = __webpack_require__2(
            /*! ./component */
            "../app-backend-core/lib/component.js"
          );
          const plugin_1 = __webpack_require__2(
            /*! ./plugin */
            "../app-backend-core/lib/plugin.js"
          );
          const devtools_api_1 = __webpack_require__2(
            /*! @vue/devtools-api */
            "../api/lib/esm/index.js"
          );
          const app_1 = __webpack_require__2(
            /*! ./app */
            "../app-backend-core/lib/app.js"
          );
          const inspector_1 = __webpack_require__2(
            /*! ./inspector */
            "../app-backend-core/lib/inspector.js"
          );
          const timeline_screenshot_1 = __webpack_require__2(
            /*! ./timeline-screenshot */
            "../app-backend-core/lib/timeline-screenshot.js"
          );
          const perf_1 = __webpack_require__2(
            /*! ./perf */
            "../app-backend-core/lib/perf.js"
          );
          const page_config_1 = __webpack_require__2(
            /*! ./page-config */
            "../app-backend-core/lib/page-config.js"
          );
          const timeline_marker_1 = __webpack_require__2(
            /*! ./timeline-marker */
            "../app-backend-core/lib/timeline-marker.js"
          );
          const flash_js_1 = __webpack_require__2(
            /*! ./flash.js */
            "../app-backend-core/lib/flash.js"
          );
          let ctx = (_a = shared_utils_1.target.__vdevtools_ctx) !== null && _a !== void 0 ? _a : null;
          let connected = (_b = shared_utils_1.target.__vdevtools_connected) !== null && _b !== void 0 ? _b : false;
          async function initBackend(bridge) {
            await (0, shared_utils_1.initSharedData)({
              bridge,
              persist: false
            });
            shared_utils_1.SharedData.isBrowser = shared_utils_1.isBrowser;
            (0, page_config_1.initOnPageConfig)();
            if (!connected) {
              ctx = shared_utils_1.target.__vdevtools_ctx = (0, app_backend_api_1.createBackendContext)({
                bridge,
                hook: global_hook_1.hook
              });
              shared_utils_1.SharedData.legacyApps = false;
              if (global_hook_1.hook.Vue) {
                connect();
                (0, app_1._legacy_getAndRegisterApps)(ctx, true);
                shared_utils_1.SharedData.legacyApps = true;
              }
              global_hook_1.hook.on(shared_utils_1.HookEvents.INIT, () => {
                (0, app_1._legacy_getAndRegisterApps)(ctx, true);
                shared_utils_1.SharedData.legacyApps = true;
              });
              global_hook_1.hook.on(shared_utils_1.HookEvents.APP_ADD, async (app) => {
                await (0, app_1.registerApp)(app, ctx);
                connect();
              });
              if (global_hook_1.hook.apps.length) {
                global_hook_1.hook.apps.forEach((app) => {
                  (0, app_1.registerApp)(app, ctx);
                  connect();
                });
              }
            } else {
              ctx.bridge = bridge;
              connectBridge();
              ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_RECONNECTED);
            }
          }
          exports.initBackend = initBackend;
          async function connect() {
            if (connected) {
              return;
            }
            connected = shared_utils_1.target.__vdevtools_connected = true;
            await (0, app_1.waitForAppsRegistration)();
            connectBridge();
            ctx.currentTab = shared_utils_1.BuiltinTabs.COMPONENTS;
            global_hook_1.hook.on(shared_utils_1.HookEvents.APP_UNMOUNT, async (app) => {
              await (0, app_1.removeApp)(app, ctx);
            });
            const _sendComponentUpdate = async (appRecord, id) => {
              try {
                if (id && (0, subscriptions_1.isSubscribed)(shared_utils_1.BridgeSubscriptions.SELECTED_COMPONENT_DATA, (sub) => sub.payload.instanceId === id)) {
                  await (0, component_1.sendSelectedComponentData)(appRecord, id, ctx);
                }
                if ((0, subscriptions_1.isSubscribed)(shared_utils_1.BridgeSubscriptions.COMPONENT_TREE, (sub) => sub.payload.instanceId === id)) {
                  await (0, component_1.sendComponentTreeData)(appRecord, id, appRecord.componentFilter, 0, false, ctx);
                }
              } catch (e) {
                if (shared_utils_1.SharedData.debugInfo) {
                  console.error(e);
                }
              }
            };
            const sendComponentUpdate = (0, throttle_1.default)(_sendComponentUpdate, 100);
            global_hook_1.hook.on(shared_utils_1.HookEvents.COMPONENT_UPDATED, async (app, uid, parentUid, component) => {
              try {
                if (!app || typeof uid !== "number" && !uid || !component)
                  return;
                let id;
                let appRecord;
                if (app && uid != null) {
                  id = await (0, component_1.getComponentId)(app, uid, component, ctx);
                  appRecord = await (0, app_1.getAppRecord)(app, ctx);
                } else {
                  id = ctx.currentInspectedComponentId;
                  appRecord = ctx.currentAppRecord;
                }
                if (shared_utils_1.SharedData.trackUpdates) {
                  await (0, component_1.sendComponentUpdateTracking)(id, ctx);
                }
                if (shared_utils_1.SharedData.flashUpdates) {
                  await (0, flash_js_1.flashComponent)(component, appRecord.backend);
                }
                await sendComponentUpdate(appRecord, id);
              } catch (e) {
                if (shared_utils_1.SharedData.debugInfo) {
                  console.error(e);
                }
              }
            });
            global_hook_1.hook.on(shared_utils_1.HookEvents.COMPONENT_ADDED, async (app, uid, parentUid, component) => {
              try {
                if (!app || typeof uid !== "number" && !uid || !component)
                  return;
                const id = await (0, component_1.getComponentId)(app, uid, component, ctx);
                const appRecord = await (0, app_1.getAppRecord)(app, ctx);
                if (component) {
                  if (component.__VUE_DEVTOOLS_UID__ == null) {
                    component.__VUE_DEVTOOLS_UID__ = id;
                  }
                  if (!appRecord.instanceMap.has(id)) {
                    appRecord.instanceMap.set(id, component);
                  }
                }
                if (uid !== 0 && parentUid === void 0) {
                  const parentId = `${id.split(":")[0]}:root`;
                  (0, component_1.sendComponentTreeData)(appRecord, parentId, appRecord.componentFilter, null, false, ctx);
                }
                if (false)
                  ;
                if (parentUid != null) {
                  const parentInstances = await appRecord.backend.api.walkComponentParents(component);
                  if (parentInstances.length) {
                    for (let i2 = 0; i2 < parentInstances.length; i2++) {
                      const parentId = await (0, component_1.getComponentId)(app, parentUid, parentInstances[i2], ctx);
                      if (i2 < 2 && (0, subscriptions_1.isSubscribed)(shared_utils_1.BridgeSubscriptions.COMPONENT_TREE, (sub) => sub.payload.instanceId === parentId)) {
                        (0, shared_utils_1.raf)(() => {
                          (0, component_1.sendComponentTreeData)(appRecord, parentId, appRecord.componentFilter, null, false, ctx);
                        });
                      }
                      if (shared_utils_1.SharedData.trackUpdates) {
                        await (0, component_1.sendComponentUpdateTracking)(parentId, ctx);
                      }
                    }
                  }
                }
                if (ctx.currentInspectedComponentId === id) {
                  await (0, component_1.sendSelectedComponentData)(appRecord, id, ctx);
                }
                if (shared_utils_1.SharedData.trackUpdates) {
                  await (0, component_1.sendComponentUpdateTracking)(id, ctx);
                }
                if (shared_utils_1.SharedData.flashUpdates) {
                  await (0, flash_js_1.flashComponent)(component, appRecord.backend);
                }
                await (0, component_1.refreshComponentTreeSearch)(ctx);
              } catch (e) {
                if (shared_utils_1.SharedData.debugInfo) {
                  console.error(e);
                }
              }
            });
            global_hook_1.hook.on(shared_utils_1.HookEvents.COMPONENT_REMOVED, async (app, uid, parentUid, component) => {
              try {
                if (!app || typeof uid !== "number" && !uid || !component)
                  return;
                const appRecord = await (0, app_1.getAppRecord)(app, ctx);
                if (uid !== 0 && parentUid === void 0) {
                  const id2 = await (0, component_1.getComponentId)(app, uid, component, ctx);
                  const parentId = `${id2.split(":")[0]}:root`;
                  (0, component_1.sendComponentTreeData)(appRecord, parentId, appRecord.componentFilter, null, false, ctx);
                }
                if (parentUid != null) {
                  const parentInstances = await appRecord.backend.api.walkComponentParents(component);
                  if (parentInstances.length) {
                    const parentId = await (0, component_1.getComponentId)(app, parentUid, parentInstances[0], ctx);
                    if ((0, subscriptions_1.isSubscribed)(shared_utils_1.BridgeSubscriptions.COMPONENT_TREE, (sub) => sub.payload.instanceId === parentId)) {
                      (0, shared_utils_1.raf)(async () => {
                        try {
                          (0, component_1.sendComponentTreeData)(await (0, app_1.getAppRecord)(app, ctx), parentId, appRecord.componentFilter, null, false, ctx);
                        } catch (e) {
                          if (shared_utils_1.SharedData.debugInfo) {
                            console.error(e);
                          }
                        }
                      });
                    }
                  }
                }
                const id = await (0, component_1.getComponentId)(app, uid, component, ctx);
                if ((0, subscriptions_1.isSubscribed)(shared_utils_1.BridgeSubscriptions.SELECTED_COMPONENT_DATA, (sub) => sub.payload.instanceId === id)) {
                  await (0, component_1.sendEmptyComponentData)(id, ctx);
                }
                appRecord.instanceMap.delete(id);
                await (0, component_1.refreshComponentTreeSearch)(ctx);
              } catch (e) {
                if (shared_utils_1.SharedData.debugInfo) {
                  console.error(e);
                }
              }
            });
            global_hook_1.hook.on(shared_utils_1.HookEvents.TRACK_UPDATE, (id, ctx2) => {
              (0, component_1.sendComponentUpdateTracking)(id, ctx2);
            });
            global_hook_1.hook.on(shared_utils_1.HookEvents.FLASH_UPDATE, (instance, backend) => {
              (0, flash_js_1.flashComponent)(instance, backend);
            });
            global_hook_1.hook.on(shared_utils_1.HookEvents.PERFORMANCE_START, async (app, uid, vm, type, time) => {
              await (0, perf_1.performanceMarkStart)(app, uid, vm, type, time, ctx);
            });
            global_hook_1.hook.on(shared_utils_1.HookEvents.PERFORMANCE_END, async (app, uid, vm, type, time) => {
              await (0, perf_1.performanceMarkEnd)(app, uid, vm, type, time, ctx);
            });
            global_hook_1.hook.on(shared_utils_1.HookEvents.COMPONENT_HIGHLIGHT, async (instanceId) => {
              await (0, highlighter_1.highlight)(ctx.currentAppRecord.instanceMap.get(instanceId), ctx.currentAppRecord.backend, ctx);
            });
            global_hook_1.hook.on(shared_utils_1.HookEvents.COMPONENT_UNHIGHLIGHT, async () => {
              await (0, highlighter_1.unHighlight)();
            });
            (0, timeline_1.setupTimeline)(ctx);
            global_hook_1.hook.on(shared_utils_1.HookEvents.TIMELINE_LAYER_ADDED, async (options, plugin) => {
              const appRecord = await (0, app_1.getAppRecord)(plugin.descriptor.app, ctx);
              ctx.timelineLayers.push({
                ...options,
                appRecord,
                plugin,
                events: []
              });
              ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_TIMELINE_LAYER_ADD, {});
            });
            global_hook_1.hook.on(shared_utils_1.HookEvents.TIMELINE_EVENT_ADDED, async (options, plugin) => {
              await (0, timeline_1.addTimelineEvent)(options, plugin.descriptor.app, ctx);
            });
            global_hook_1.hook.on(shared_utils_1.HookEvents.CUSTOM_INSPECTOR_ADD, async (options, plugin) => {
              const appRecord = await (0, app_1.getAppRecord)(plugin.descriptor.app, ctx);
              ctx.customInspectors.push({
                ...options,
                appRecord,
                plugin,
                treeFilter: "",
                selectedNodeId: null
              });
              ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_CUSTOM_INSPECTOR_ADD, {});
            });
            global_hook_1.hook.on(shared_utils_1.HookEvents.CUSTOM_INSPECTOR_SEND_TREE, async (inspectorId, plugin) => {
              const inspector = (0, inspector_1.getInspector)(inspectorId, plugin.descriptor.app, ctx);
              if (inspector) {
                await (0, inspector_1.sendInspectorTree)(inspector, ctx);
              } else if (shared_utils_1.SharedData.debugInfo) {
                console.warn(`Inspector ${inspectorId} not found`);
              }
            });
            global_hook_1.hook.on(shared_utils_1.HookEvents.CUSTOM_INSPECTOR_SEND_STATE, async (inspectorId, plugin) => {
              const inspector = (0, inspector_1.getInspector)(inspectorId, plugin.descriptor.app, ctx);
              if (inspector) {
                await (0, inspector_1.sendInspectorState)(inspector, ctx);
              } else if (shared_utils_1.SharedData.debugInfo) {
                console.warn(`Inspector ${inspectorId} not found`);
              }
            });
            global_hook_1.hook.on(shared_utils_1.HookEvents.CUSTOM_INSPECTOR_SELECT_NODE, async (inspectorId, nodeId, plugin) => {
              const inspector = (0, inspector_1.getInspector)(inspectorId, plugin.descriptor.app, ctx);
              if (inspector) {
                await (0, inspector_1.selectInspectorNode)(inspector, nodeId, ctx);
              } else if (shared_utils_1.SharedData.debugInfo) {
                console.warn(`Inspector ${inspectorId} not found`);
              }
            });
            try {
              await (0, plugin_1.addPreviouslyRegisteredPlugins)(ctx);
            } catch (e) {
              console.error(`Error adding previously registered plugins:`);
              console.error(e);
            }
            try {
              await (0, plugin_1.addQueuedPlugins)(ctx);
            } catch (e) {
              console.error(`Error adding queued plugins:`);
              console.error(e);
            }
            global_hook_1.hook.on(shared_utils_1.HookEvents.SETUP_DEVTOOLS_PLUGIN, async (pluginDescriptor, setupFn) => {
              await (0, plugin_1.addPlugin)({
                pluginDescriptor,
                setupFn
              }, ctx);
            });
            shared_utils_1.target.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__ = true;
            const handleFlush = (0, debounce_1.default)(async () => {
              var _a2;
              if ((_a2 = ctx.currentAppRecord) === null || _a2 === void 0 ? void 0 : _a2.backend.options.features.includes(app_backend_api_1.BuiltinBackendFeature.FLUSH)) {
                await (0, component_1.sendComponentTreeData)(ctx.currentAppRecord, "_root", ctx.currentAppRecord.componentFilter, null, false, ctx);
                if (ctx.currentInspectedComponentId) {
                  await (0, component_1.sendSelectedComponentData)(ctx.currentAppRecord, ctx.currentInspectedComponentId, ctx);
                }
              }
            }, 500);
            global_hook_1.hook.off(shared_utils_1.HookEvents.FLUSH);
            global_hook_1.hook.on(shared_utils_1.HookEvents.FLUSH, handleFlush);
            try {
              await (0, timeline_marker_1.addTimelineMarker)({
                id: "vue-devtools-init-backend",
                time: (0, devtools_api_1.now)(),
                label: "Vue Devtools connected",
                color: 4307075,
                all: true
              }, ctx);
            } catch (e) {
              console.error(`Error while adding devtools connected timeline marker:`);
              console.error(e);
            }
          }
          function connectBridge() {
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_SUBSCRIBE, ({
              type,
              payload
            }) => {
              (0, subscriptions_1.subscribe)(type, payload);
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_UNSUBSCRIBE, ({
              type,
              payload
            }) => {
              (0, subscriptions_1.unsubscribe)(type, payload);
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_TAB_SWITCH, async (tab) => {
              ctx.currentTab = tab;
              await (0, highlighter_1.unHighlight)();
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_APP_LIST, async () => {
              await (0, app_1.sendApps)(ctx);
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_APP_SELECT, async (id) => {
              if (id == null)
                return;
              const record = ctx.appRecords.find((r2) => r2.id === id);
              if (record) {
                await (0, app_1.selectApp)(record, ctx);
              } else if (shared_utils_1.SharedData.debugInfo) {
                console.warn(`App with id ${id} not found`);
              }
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_SCAN_LEGACY_APPS, () => {
              if (global_hook_1.hook.Vue) {
                (0, app_1._legacy_getAndRegisterApps)(ctx);
              }
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_COMPONENT_TREE, async ({
              instanceId,
              filter,
              recursively
            }) => {
              ctx.currentAppRecord.componentFilter = filter;
              (0, subscriptions_1.subscribe)(shared_utils_1.BridgeSubscriptions.COMPONENT_TREE, {
                instanceId
              });
              await (0, component_1.sendComponentTreeData)(ctx.currentAppRecord, instanceId, filter, null, recursively, ctx);
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_COMPONENT_SELECTED_DATA, async (instanceId) => {
              await (0, component_1.sendSelectedComponentData)(ctx.currentAppRecord, instanceId, ctx);
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_COMPONENT_EDIT_STATE, async ({
              instanceId,
              dotPath,
              type,
              value,
              newKey,
              remove
            }) => {
              await (0, component_1.editComponentState)(instanceId, dotPath, type, {
                value,
                newKey,
                remove
              }, ctx);
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_COMPONENT_INSPECT_DOM, async ({
              instanceId
            }) => {
              const instance = (0, component_1.getComponentInstance)(ctx.currentAppRecord, instanceId, ctx);
              if (instance) {
                const [el] = await ctx.currentAppRecord.backend.api.getComponentRootElements(instance);
                if (el) {
                  shared_utils_1.target.__VUE_DEVTOOLS_INSPECT_TARGET__ = el;
                  ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_COMPONENT_INSPECT_DOM, null);
                }
              }
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_COMPONENT_SCROLL_TO, async ({
              instanceId
            }) => {
              if (!shared_utils_1.isBrowser)
                return;
              const instance = (0, component_1.getComponentInstance)(ctx.currentAppRecord, instanceId, ctx);
              if (instance) {
                const [el] = await ctx.currentAppRecord.backend.api.getComponentRootElements(instance);
                if (el) {
                  if (typeof el.scrollIntoView === "function") {
                    el.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                      inline: "center"
                    });
                  } else {
                    const bounds = await ctx.currentAppRecord.backend.api.getComponentBounds(instance);
                    const scrollTarget = document.createElement("div");
                    scrollTarget.style.position = "absolute";
                    scrollTarget.style.width = `${bounds.width}px`;
                    scrollTarget.style.height = `${bounds.height}px`;
                    scrollTarget.style.top = `${bounds.top}px`;
                    scrollTarget.style.left = `${bounds.left}px`;
                    document.body.appendChild(scrollTarget);
                    scrollTarget.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                      inline: "center"
                    });
                    setTimeout(() => {
                      document.body.removeChild(scrollTarget);
                    }, 2e3);
                  }
                  (0, highlighter_1.highlight)(instance, ctx.currentAppRecord.backend, ctx);
                  setTimeout(() => {
                    (0, highlighter_1.unHighlight)();
                  }, 2e3);
                }
              }
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_COMPONENT_RENDER_CODE, async ({
              instanceId
            }) => {
              if (!shared_utils_1.isBrowser)
                return;
              const instance = (0, component_1.getComponentInstance)(ctx.currentAppRecord, instanceId, ctx);
              if (instance) {
                const {
                  code: code2
                } = await ctx.currentAppRecord.backend.api.getComponentRenderCode(instance);
                ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_COMPONENT_RENDER_CODE, {
                  instanceId,
                  code: code2
                });
              }
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_CUSTOM_STATE_ACTION, async ({
              value,
              actionIndex
            }) => {
              const rawAction = value._custom.actions[actionIndex];
              const action = (0, shared_utils_1.revive)(rawAction === null || rawAction === void 0 ? void 0 : rawAction.action);
              if (action) {
                try {
                  await action();
                } catch (e) {
                  console.error(e);
                }
              } else {
                console.warn(`Couldn't revive action ${actionIndex} from`, value);
              }
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_COMPONENT_MOUSE_OVER, async (instanceId) => {
              await (0, highlighter_1.highlight)(ctx.currentAppRecord.instanceMap.get(instanceId), ctx.currentAppRecord.backend, ctx);
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_COMPONENT_MOUSE_OUT, async () => {
              await (0, highlighter_1.unHighlight)();
            });
            const componentPicker = new component_pick_1.default(ctx);
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_COMPONENT_PICK, () => {
              componentPicker.startSelecting();
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_COMPONENT_PICK_CANCELED, () => {
              componentPicker.stopSelecting();
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_TIMELINE_LAYER_LIST, async () => {
              await (0, timeline_1.sendTimelineLayers)(ctx);
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_TIMELINE_SHOW_SCREENSHOT, async ({
              screenshot
            }) => {
              await (0, timeline_screenshot_1.showScreenshot)(screenshot, ctx);
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_TIMELINE_CLEAR, async () => {
              await (0, timeline_1.clearTimeline)(ctx);
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_TIMELINE_EVENT_DATA, async ({
              id
            }) => {
              await (0, timeline_1.sendTimelineEventData)(id, ctx);
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_TIMELINE_LAYER_LOAD_EVENTS, async ({
              appId,
              layerId
            }) => {
              await (0, timeline_1.sendTimelineLayerEvents)(appId, layerId, ctx);
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_TIMELINE_LOAD_MARKERS, async () => {
              await (0, timeline_marker_1.sendTimelineMarkers)(ctx);
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_CUSTOM_INSPECTOR_LIST, async () => {
              await (0, inspector_1.sendCustomInspectors)(ctx);
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_CUSTOM_INSPECTOR_TREE, async ({
              inspectorId,
              appId,
              treeFilter
            }) => {
              const inspector = await (0, inspector_1.getInspectorWithAppId)(inspectorId, appId, ctx);
              if (inspector) {
                inspector.treeFilter = treeFilter;
                (0, inspector_1.sendInspectorTree)(inspector, ctx);
              } else if (shared_utils_1.SharedData.debugInfo) {
                console.warn(`Inspector ${inspectorId} not found`);
              }
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_CUSTOM_INSPECTOR_STATE, async ({
              inspectorId,
              appId,
              nodeId
            }) => {
              const inspector = await (0, inspector_1.getInspectorWithAppId)(inspectorId, appId, ctx);
              if (inspector) {
                inspector.selectedNodeId = nodeId;
                (0, inspector_1.sendInspectorState)(inspector, ctx);
              } else if (shared_utils_1.SharedData.debugInfo) {
                console.warn(`Inspector ${inspectorId} not found`);
              }
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_CUSTOM_INSPECTOR_EDIT_STATE, async ({
              inspectorId,
              appId,
              nodeId,
              path,
              type,
              payload
            }) => {
              const inspector = await (0, inspector_1.getInspectorWithAppId)(inspectorId, appId, ctx);
              if (inspector) {
                await (0, inspector_1.editInspectorState)(inspector, nodeId, path, type, payload, ctx);
                inspector.selectedNodeId = nodeId;
                await (0, inspector_1.sendInspectorState)(inspector, ctx);
              } else if (shared_utils_1.SharedData.debugInfo) {
                console.warn(`Inspector ${inspectorId} not found`);
              }
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_CUSTOM_INSPECTOR_ACTION, async ({
              inspectorId,
              appId,
              actionIndex,
              actionType,
              args
            }) => {
              const inspector = await (0, inspector_1.getInspectorWithAppId)(inspectorId, appId, ctx);
              if (inspector) {
                const action = inspector[actionType !== null && actionType !== void 0 ? actionType : "actions"][actionIndex];
                try {
                  await action.action(...args !== null && args !== void 0 ? args : []);
                } catch (e) {
                  if (shared_utils_1.SharedData.debugInfo) {
                    console.error(e);
                  }
                }
              } else if (shared_utils_1.SharedData.debugInfo) {
                console.warn(`Inspector ${inspectorId} not found`);
              }
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_LOG, (payload) => {
              let value = payload.value;
              if (payload.serialized) {
                value = (0, shared_utils_1.parse)(value, payload.revive);
              } else if (payload.revive) {
                value = (0, shared_utils_1.revive)(value);
              }
              console[payload.level](value);
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_DEVTOOLS_PLUGIN_LIST, async () => {
              await (0, plugin_1.sendPluginList)(ctx);
            });
            ctx.bridge.on(shared_utils_1.BridgeEvents.TO_BACK_DEVTOOLS_PLUGIN_SETTING_UPDATED, ({
              pluginId,
              key,
              newValue,
              oldValue
            }) => {
              const settings = (0, shared_utils_1.getPluginSettings)(pluginId);
              ctx.hook.emit(shared_utils_1.HookEvents.PLUGIN_SETTINGS_SET, pluginId, settings);
              ctx.currentAppRecord.backend.api.callHook(
                "setPluginSettings",
                {
                  app: ctx.currentAppRecord.options.app,
                  pluginId,
                  key,
                  newValue,
                  oldValue,
                  settings
                }
              );
            });
          }
        }
      ),
      /***/
      "../app-backend-core/lib/inspector.js": (
        /*!********************************************!*\
          !*** ../app-backend-core/lib/inspector.js ***!
          \********************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.selectInspectorNode = exports.sendCustomInspectors = exports.editInspectorState = exports.sendInspectorState = exports.sendInspectorTree = exports.getInspectorWithAppId = exports.getInspector = void 0;
          const shared_utils_1 = __webpack_require__2(
            /*! @vue-devtools/shared-utils */
            "../shared-utils/lib/index.js"
          );
          function getInspector(inspectorId, app, ctx) {
            return ctx.customInspectors.find((i2) => i2.id === inspectorId && i2.appRecord.options.app === app);
          }
          exports.getInspector = getInspector;
          async function getInspectorWithAppId(inspectorId, appId, ctx) {
            for (const i2 of ctx.customInspectors) {
              if (i2.id === inspectorId && i2.appRecord.id === appId) {
                return i2;
              }
            }
            return null;
          }
          exports.getInspectorWithAppId = getInspectorWithAppId;
          async function sendInspectorTree(inspector, ctx) {
            const rootNodes = await inspector.appRecord.backend.api.getInspectorTree(inspector.id, inspector.appRecord.options.app, inspector.treeFilter);
            ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_CUSTOM_INSPECTOR_TREE, {
              appId: inspector.appRecord.id,
              inspectorId: inspector.id,
              rootNodes
            });
          }
          exports.sendInspectorTree = sendInspectorTree;
          async function sendInspectorState(inspector, ctx) {
            const state = inspector.selectedNodeId ? await inspector.appRecord.backend.api.getInspectorState(inspector.id, inspector.appRecord.options.app, inspector.selectedNodeId) : null;
            ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_CUSTOM_INSPECTOR_STATE, {
              appId: inspector.appRecord.id,
              inspectorId: inspector.id,
              state: (0, shared_utils_1.stringify)(state)
            });
          }
          exports.sendInspectorState = sendInspectorState;
          async function editInspectorState(inspector, nodeId, dotPath, type, state, ctx) {
            await inspector.appRecord.backend.api.editInspectorState(inspector.id, inspector.appRecord.options.app, nodeId, dotPath, type, {
              ...state,
              value: state.value != null ? (0, shared_utils_1.parse)(state.value, true) : state.value
            });
          }
          exports.editInspectorState = editInspectorState;
          async function sendCustomInspectors(ctx) {
            var _a, _b;
            const inspectors = [];
            for (const i2 of ctx.customInspectors) {
              inspectors.push({
                id: i2.id,
                appId: i2.appRecord.id,
                pluginId: i2.plugin.descriptor.id,
                label: i2.label,
                icon: i2.icon,
                treeFilterPlaceholder: i2.treeFilterPlaceholder,
                stateFilterPlaceholder: i2.stateFilterPlaceholder,
                noSelectionText: i2.noSelectionText,
                actions: (_a = i2.actions) === null || _a === void 0 ? void 0 : _a.map((a2) => ({
                  icon: a2.icon,
                  tooltip: a2.tooltip
                })),
                nodeActions: (_b = i2.nodeActions) === null || _b === void 0 ? void 0 : _b.map((a2) => ({
                  icon: a2.icon,
                  tooltip: a2.tooltip
                }))
              });
            }
            ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_CUSTOM_INSPECTOR_LIST, {
              inspectors
            });
          }
          exports.sendCustomInspectors = sendCustomInspectors;
          async function selectInspectorNode(inspector, nodeId, ctx) {
            ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_CUSTOM_INSPECTOR_SELECT_NODE, {
              appId: inspector.appRecord.id,
              inspectorId: inspector.id,
              nodeId
            });
          }
          exports.selectInspectorNode = selectInspectorNode;
        }
      ),
      /***/
      "../app-backend-core/lib/legacy/scan.js": (
        /*!**********************************************!*\
          !*** ../app-backend-core/lib/legacy/scan.js ***!
          \**********************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.scan = void 0;
          const shared_utils_1 = __webpack_require__2(
            /*! @vue-devtools/shared-utils */
            "../shared-utils/lib/index.js"
          );
          const page_config_1 = __webpack_require__2(
            /*! ../page-config */
            "../app-backend-core/lib/page-config.js"
          );
          const rootInstances = [];
          function scan() {
            rootInstances.length = 0;
            let inFragment = false;
            let currentFragment = null;
            function processInstance(instance) {
              if (instance) {
                if (rootInstances.indexOf(instance.$root) === -1) {
                  instance = instance.$root;
                }
                if (instance._isFragment) {
                  inFragment = true;
                  currentFragment = instance;
                }
                let baseVue = instance.constructor;
                while (baseVue.super) {
                  baseVue = baseVue.super;
                }
                if (baseVue.config && baseVue.config.devtools) {
                  rootInstances.push(instance);
                }
                return true;
              }
            }
            if (shared_utils_1.isBrowser) {
              const walkDocument = (document2) => {
                walk(document2, function(node) {
                  if (inFragment) {
                    if (node === currentFragment._fragmentEnd) {
                      inFragment = false;
                      currentFragment = null;
                    }
                    return true;
                  }
                  const instance = node.__vue__;
                  return processInstance(instance);
                });
              };
              walkDocument(document);
              const iframes = document.querySelectorAll("iframe");
              for (const iframe of iframes) {
                try {
                  walkDocument(iframe.contentDocument);
                } catch (e) {
                }
              }
              const {
                customVue2ScanSelector
              } = (0, page_config_1.getPageConfig)();
              const customTargets = customVue2ScanSelector ? document.querySelectorAll(customVue2ScanSelector) : [];
              for (const customTarget of customTargets) {
                try {
                  walkDocument(customTarget);
                } catch (e) {
                }
              }
            } else {
              if (Array.isArray(shared_utils_1.target.__VUE_ROOT_INSTANCES__)) {
                shared_utils_1.target.__VUE_ROOT_INSTANCES__.map(processInstance);
              }
            }
            return rootInstances;
          }
          exports.scan = scan;
          function walk(node, fn) {
            if (node.childNodes) {
              for (let i2 = 0, l2 = node.childNodes.length; i2 < l2; i2++) {
                const child = node.childNodes[i2];
                const stop = fn(child);
                if (!stop) {
                  walk(child, fn);
                }
              }
            }
            if (node.shadowRoot) {
              walk(node.shadowRoot, fn);
            }
          }
        }
      ),
      /***/
      "../app-backend-core/lib/page-config.js": (
        /*!**********************************************!*\
          !*** ../app-backend-core/lib/page-config.js ***!
          \**********************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.initOnPageConfig = exports.getPageConfig = void 0;
          const shared_utils_1 = __webpack_require__2(
            /*! @vue-devtools/shared-utils */
            "../shared-utils/lib/index.js"
          );
          let config2 = {};
          function getPageConfig() {
            return config2;
          }
          exports.getPageConfig = getPageConfig;
          function initOnPageConfig() {
            if (Object.hasOwnProperty.call(shared_utils_1.target, "VUE_DEVTOOLS_CONFIG")) {
              config2 = shared_utils_1.SharedData.pageConfig = shared_utils_1.target.VUE_DEVTOOLS_CONFIG;
              if (Object.hasOwnProperty.call(config2, "openInEditorHost")) {
                shared_utils_1.SharedData.openInEditorHost = config2.openInEditorHost;
              }
            }
          }
          exports.initOnPageConfig = initOnPageConfig;
        }
      ),
      /***/
      "../app-backend-core/lib/perf.js": (
        /*!***************************************!*\
          !*** ../app-backend-core/lib/perf.js ***!
          \***************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.handleAddPerformanceTag = exports.performanceMarkEnd = exports.performanceMarkStart = void 0;
          const shared_utils_1 = __webpack_require__2(
            /*! @vue-devtools/shared-utils */
            "../shared-utils/lib/index.js"
          );
          const timeline_1 = __webpack_require__2(
            /*! ./timeline */
            "../app-backend-core/lib/timeline.js"
          );
          const app_1 = __webpack_require__2(
            /*! ./app */
            "../app-backend-core/lib/app.js"
          );
          const component_1 = __webpack_require__2(
            /*! ./component */
            "../app-backend-core/lib/component.js"
          );
          const subscriptions_1 = __webpack_require__2(
            /*! ./util/subscriptions */
            "../app-backend-core/lib/util/subscriptions.js"
          );
          async function performanceMarkStart(app, uid, instance, type, time, ctx) {
            try {
              if (!shared_utils_1.SharedData.performanceMonitoringEnabled)
                return;
              const appRecord = await (0, app_1.getAppRecord)(app, ctx);
              const componentName = await appRecord.backend.api.getComponentName(instance);
              const groupId = ctx.perfUniqueGroupId++;
              const groupKey = `${uid}-${type}`;
              appRecord.perfGroupIds.set(groupKey, {
                groupId,
                time
              });
              await (0, timeline_1.addTimelineEvent)({
                layerId: "performance",
                event: {
                  time,
                  data: {
                    component: componentName,
                    type,
                    measure: "start"
                  },
                  title: componentName,
                  subtitle: type,
                  groupId
                }
              }, app, ctx);
              if (markEndQueue.has(groupKey)) {
                const {
                  app: app2,
                  uid: uid2,
                  instance: instance2,
                  type: type2,
                  time: time2
                } = markEndQueue.get(groupKey);
                markEndQueue.delete(groupKey);
                await performanceMarkEnd(app2, uid2, instance2, type2, time2, ctx);
              }
            } catch (e) {
              if (shared_utils_1.SharedData.debugInfo) {
                console.error(e);
              }
            }
          }
          exports.performanceMarkStart = performanceMarkStart;
          const markEndQueue = /* @__PURE__ */ new Map();
          async function performanceMarkEnd(app, uid, instance, type, time, ctx) {
            try {
              if (!shared_utils_1.SharedData.performanceMonitoringEnabled)
                return;
              const appRecord = await (0, app_1.getAppRecord)(app, ctx);
              const componentName = await appRecord.backend.api.getComponentName(instance);
              const groupKey = `${uid}-${type}`;
              const groupInfo = appRecord.perfGroupIds.get(groupKey);
              if (!groupInfo) {
                markEndQueue.set(groupKey, {
                  app,
                  uid,
                  instance,
                  type,
                  time
                });
                return;
              }
              const {
                groupId,
                time: startTime
              } = groupInfo;
              const duration = time - startTime;
              await (0, timeline_1.addTimelineEvent)({
                layerId: "performance",
                event: {
                  time,
                  data: {
                    component: componentName,
                    type,
                    measure: "end",
                    duration: {
                      _custom: {
                        type: "Duration",
                        value: duration,
                        display: `${duration} ms`
                      }
                    }
                  },
                  title: componentName,
                  subtitle: type,
                  groupId
                }
              }, app, ctx);
              const tooSlow = duration > 10;
              if (tooSlow || instance.__VUE_DEVTOOLS_SLOW__) {
                let change = false;
                if (tooSlow && !instance.__VUE_DEVTOOLS_SLOW__) {
                  instance.__VUE_DEVTOOLS_SLOW__ = {
                    duration: null,
                    measures: {}
                  };
                }
                const data = instance.__VUE_DEVTOOLS_SLOW__;
                if (tooSlow && (data.duration == null || data.duration < duration)) {
                  data.duration = duration;
                  change = true;
                }
                if (data.measures[type] == null || data.measures[type] < duration) {
                  data.measures[type] = duration;
                  change = true;
                }
                if (change) {
                  const id = await (0, component_1.getComponentId)(app, uid, instance, ctx);
                  if ((0, subscriptions_1.isSubscribed)(shared_utils_1.BridgeSubscriptions.COMPONENT_TREE, (sub) => sub.payload.instanceId === id)) {
                    (0, shared_utils_1.raf)(() => {
                      (0, component_1.sendComponentTreeData)(appRecord, id, ctx.currentAppRecord.componentFilter, null, false, ctx);
                    });
                  }
                }
              }
            } catch (e) {
              if (shared_utils_1.SharedData.debugInfo) {
                console.error(e);
              }
            }
          }
          exports.performanceMarkEnd = performanceMarkEnd;
          function handleAddPerformanceTag(backend, ctx) {
            backend.api.on.visitComponentTree((payload) => {
              if (payload.componentInstance.__VUE_DEVTOOLS_SLOW__) {
                const {
                  duration,
                  measures
                } = payload.componentInstance.__VUE_DEVTOOLS_SLOW__;
                let tooltip = '<div class="grid grid-cols-2 gap-2 font-mono text-xs">';
                for (const type in measures) {
                  const d2 = measures[type];
                  tooltip += `<div>${type}</div><div class="text-right text-black rounded px-1 ${d2 > 30 ? "bg-red-400" : d2 > 10 ? "bg-yellow-400" : "bg-green-400"}">${Math.round(d2 * 1e3) / 1e3} ms</div>`;
                }
                tooltip += "</div>";
                payload.treeNode.tags.push({
                  backgroundColor: duration > 30 ? 16281969 : 16498468,
                  textColor: 0,
                  label: `${Math.round(duration * 1e3) / 1e3} ms`,
                  tooltip
                });
              }
            });
          }
          exports.handleAddPerformanceTag = handleAddPerformanceTag;
        }
      ),
      /***/
      "../app-backend-core/lib/plugin.js": (
        /*!*****************************************!*\
          !*** ../app-backend-core/lib/plugin.js ***!
          \*****************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.serializePlugin = exports.sendPluginList = exports.addPreviouslyRegisteredPlugins = exports.addQueuedPlugins = exports.addPlugin = void 0;
          const app_backend_api_1 = __webpack_require__2(
            /*! @vue-devtools/app-backend-api */
            "../app-backend-api/lib/index.js"
          );
          const shared_utils_1 = __webpack_require__2(
            /*! @vue-devtools/shared-utils */
            "../shared-utils/lib/index.js"
          );
          const app_1 = __webpack_require__2(
            /*! ./app */
            "../app-backend-core/lib/app.js"
          );
          async function addPlugin(pluginQueueItem, ctx) {
            const {
              pluginDescriptor,
              setupFn
            } = pluginQueueItem;
            const plugin = {
              descriptor: pluginDescriptor,
              setupFn,
              error: null
            };
            ctx.currentPlugin = plugin;
            try {
              const appRecord = await (0, app_1.getAppRecord)(plugin.descriptor.app, ctx);
              const api = new app_backend_api_1.DevtoolsPluginApiInstance(plugin, appRecord, ctx);
              if (pluginQueueItem.proxy) {
                await pluginQueueItem.proxy.setRealTarget(api);
              } else {
                setupFn(api);
              }
            } catch (e) {
              plugin.error = e;
              if (shared_utils_1.SharedData.debugInfo) {
                console.error(e);
              }
            }
            ctx.currentPlugin = null;
            ctx.plugins.push(plugin);
            ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_DEVTOOLS_PLUGIN_ADD, {
              plugin: await serializePlugin(plugin)
            });
            const targetList = shared_utils_1.target.__VUE_DEVTOOLS_REGISTERED_PLUGINS__ = shared_utils_1.target.__VUE_DEVTOOLS_REGISTERED_PLUGINS__ || [];
            targetList.push({
              pluginDescriptor,
              setupFn
            });
          }
          exports.addPlugin = addPlugin;
          async function addQueuedPlugins(ctx) {
            if (shared_utils_1.target.__VUE_DEVTOOLS_PLUGINS__ && Array.isArray(shared_utils_1.target.__VUE_DEVTOOLS_PLUGINS__)) {
              for (const queueItem of shared_utils_1.target.__VUE_DEVTOOLS_PLUGINS__) {
                await addPlugin(queueItem, ctx);
              }
              shared_utils_1.target.__VUE_DEVTOOLS_PLUGINS__ = null;
            }
          }
          exports.addQueuedPlugins = addQueuedPlugins;
          async function addPreviouslyRegisteredPlugins(ctx) {
            if (shared_utils_1.target.__VUE_DEVTOOLS_REGISTERED_PLUGINS__ && Array.isArray(shared_utils_1.target.__VUE_DEVTOOLS_REGISTERED_PLUGINS__)) {
              for (const queueItem of shared_utils_1.target.__VUE_DEVTOOLS_REGISTERED_PLUGINS__) {
                await addPlugin(queueItem, ctx);
              }
            }
          }
          exports.addPreviouslyRegisteredPlugins = addPreviouslyRegisteredPlugins;
          async function sendPluginList(ctx) {
            ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_DEVTOOLS_PLUGIN_LIST, {
              plugins: await Promise.all(ctx.plugins.map((p2) => serializePlugin(p2)))
            });
          }
          exports.sendPluginList = sendPluginList;
          async function serializePlugin(plugin) {
            return {
              id: plugin.descriptor.id,
              label: plugin.descriptor.label,
              appId: (0, app_1.getAppRecordId)(plugin.descriptor.app),
              packageName: plugin.descriptor.packageName,
              homepage: plugin.descriptor.homepage,
              logo: plugin.descriptor.logo,
              componentStateTypes: plugin.descriptor.componentStateTypes,
              settingsSchema: plugin.descriptor.settings
            };
          }
          exports.serializePlugin = serializePlugin;
        }
      ),
      /***/
      "../app-backend-core/lib/timeline-builtins.js": (
        /*!****************************************************!*\
          !*** ../app-backend-core/lib/timeline-builtins.js ***!
          \****************************************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.builtinLayers = void 0;
          exports.builtinLayers = [{
            id: "mouse",
            label: "Mouse",
            color: 10768815,
            screenshotOverlayRender(event, {
              events
            }) {
              const samePositionEvent = events.find((e) => e !== event && e.renderMeta.textEl && e.data.x === event.data.x && e.data.y === event.data.y);
              if (samePositionEvent) {
                const text2 = document.createElement("div");
                text2.innerText = event.data.type;
                samePositionEvent.renderMeta.textEl.appendChild(text2);
                return false;
              }
              const div = document.createElement("div");
              div.style.position = "absolute";
              div.style.left = `${event.data.x - 4}px`;
              div.style.top = `${event.data.y - 4}px`;
              div.style.width = "8px";
              div.style.height = "8px";
              div.style.borderRadius = "100%";
              div.style.backgroundColor = "rgba(164, 81, 175, 0.5)";
              const text = document.createElement("div");
              text.innerText = event.data.type;
              text.style.color = "#541e5b";
              text.style.fontFamily = "monospace";
              text.style.fontSize = "9px";
              text.style.position = "absolute";
              text.style.left = "10px";
              text.style.top = "10px";
              text.style.padding = "1px";
              text.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
              text.style.borderRadius = "3px";
              div.appendChild(text);
              event.renderMeta.textEl = text;
              return div;
            }
          }, {
            id: "keyboard",
            label: "Keyboard",
            color: 8475055
          }, {
            id: "component-event",
            label: "Component events",
            color: 4307075,
            screenshotOverlayRender: (event, {
              events
            }) => {
              if (!event.meta.bounds || events.some((e) => e !== event && e.layerId === event.layerId && e.renderMeta.drawn && (e.meta.componentId === event.meta.componentId || e.meta.bounds.left === event.meta.bounds.left && e.meta.bounds.top === event.meta.bounds.top && e.meta.bounds.width === event.meta.bounds.width && e.meta.bounds.height === event.meta.bounds.height))) {
                return false;
              }
              const div = document.createElement("div");
              div.style.position = "absolute";
              div.style.left = `${event.meta.bounds.left - 4}px`;
              div.style.top = `${event.meta.bounds.top - 4}px`;
              div.style.width = `${event.meta.bounds.width}px`;
              div.style.height = `${event.meta.bounds.height}px`;
              div.style.borderRadius = "8px";
              div.style.borderStyle = "solid";
              div.style.borderWidth = "4px";
              div.style.borderColor = "rgba(65, 184, 131, 0.5)";
              div.style.textAlign = "center";
              div.style.display = "flex";
              div.style.alignItems = "center";
              div.style.justifyContent = "center";
              div.style.overflow = "hidden";
              const text = document.createElement("div");
              text.style.color = "#267753";
              text.style.fontFamily = "monospace";
              text.style.fontSize = "9px";
              text.style.padding = "1px";
              text.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
              text.style.borderRadius = "3px";
              text.innerText = event.data.event;
              div.appendChild(text);
              event.renderMeta.drawn = true;
              return div;
            }
          }, {
            id: "performance",
            label: "Performance",
            color: 4307050,
            groupsOnly: true,
            skipScreenshots: true,
            ignoreNoDurationGroups: true
          }];
        }
      ),
      /***/
      "../app-backend-core/lib/timeline-marker.js": (
        /*!**************************************************!*\
          !*** ../app-backend-core/lib/timeline-marker.js ***!
          \**************************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.sendTimelineMarkers = exports.addTimelineMarker = void 0;
          const shared_utils_1 = __webpack_require__2(
            /*! @vue-devtools/shared-utils */
            "../shared-utils/lib/index.js"
          );
          const devtools_api_1 = __webpack_require__2(
            /*! @vue/devtools-api */
            "../api/lib/esm/index.js"
          );
          const timeline_1 = __webpack_require__2(
            /*! ./timeline */
            "../app-backend-core/lib/timeline.js"
          );
          async function addTimelineMarker(options, ctx) {
            var _a;
            if (!ctx.currentAppRecord) {
              options.all = true;
            }
            const marker = {
              ...options,
              appRecord: options.all ? null : ctx.currentAppRecord
            };
            ctx.timelineMarkers.push(marker);
            ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_TIMELINE_MARKER, {
              marker: await serializeMarker(marker),
              appId: (_a = ctx.currentAppRecord) === null || _a === void 0 ? void 0 : _a.id
            });
          }
          exports.addTimelineMarker = addTimelineMarker;
          async function sendTimelineMarkers(ctx) {
            if (!ctx.currentAppRecord)
              return;
            const markers = ctx.timelineMarkers.filter((marker) => marker.all || marker.appRecord === ctx.currentAppRecord);
            const result = [];
            for (const marker of markers) {
              result.push(await serializeMarker(marker));
            }
            ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_TIMELINE_LOAD_MARKERS, {
              markers: result,
              appId: ctx.currentAppRecord.id
            });
          }
          exports.sendTimelineMarkers = sendTimelineMarkers;
          async function serializeMarker(marker) {
            var _a;
            let time = marker.time;
            if ((0, devtools_api_1.isPerformanceSupported)() && time < timeline_1.dateThreshold) {
              time += timeline_1.perfTimeDiff;
            }
            return {
              id: marker.id,
              appId: (_a = marker.appRecord) === null || _a === void 0 ? void 0 : _a.id,
              all: marker.all,
              time: Math.round(time * 1e3),
              label: marker.label,
              color: marker.color
            };
          }
        }
      ),
      /***/
      "../app-backend-core/lib/timeline-screenshot.js": (
        /*!******************************************************!*\
          !*** ../app-backend-core/lib/timeline-screenshot.js ***!
          \******************************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.showScreenshot = void 0;
          const shared_utils_1 = __webpack_require__2(
            /*! @vue-devtools/shared-utils */
            "../shared-utils/lib/index.js"
          );
          const queue_1 = __webpack_require__2(
            /*! ./util/queue */
            "../app-backend-core/lib/util/queue.js"
          );
          const timeline_builtins_1 = __webpack_require__2(
            /*! ./timeline-builtins */
            "../app-backend-core/lib/timeline-builtins.js"
          );
          let overlay;
          let image2;
          let container;
          const jobQueue = new queue_1.JobQueue();
          async function showScreenshot(screenshot, ctx) {
            await jobQueue.queue("showScreenshot", async () => {
              if (screenshot) {
                if (!container) {
                  createElements();
                }
                image2.src = screenshot.image;
                image2.style.visibility = screenshot.image ? "visible" : "hidden";
                clearContent();
                const events = screenshot.events.map((id) => ctx.timelineEventMap.get(id)).filter(Boolean).map((eventData) => ({
                  layer: timeline_builtins_1.builtinLayers.concat(ctx.timelineLayers).find((layer) => layer.id === eventData.layerId),
                  event: {
                    ...eventData.event,
                    layerId: eventData.layerId,
                    renderMeta: {}
                  }
                }));
                const renderContext = {
                  screenshot,
                  events: events.map(({
                    event
                  }) => event),
                  index: 0
                };
                for (let i2 = 0; i2 < events.length; i2++) {
                  const {
                    layer,
                    event
                  } = events[i2];
                  if (layer.screenshotOverlayRender) {
                    renderContext.index = i2;
                    try {
                      const result = await layer.screenshotOverlayRender(event, renderContext);
                      if (result !== false) {
                        if (typeof result === "string") {
                          container.innerHTML += result;
                        } else {
                          container.appendChild(result);
                        }
                      }
                    } catch (e) {
                      if (shared_utils_1.SharedData.debugInfo) {
                        console.error(e);
                      }
                    }
                  }
                }
                showElement();
              } else {
                hideElement();
              }
            });
          }
          exports.showScreenshot = showScreenshot;
          function createElements() {
            overlay = document.createElement("div");
            overlay.style.position = "fixed";
            overlay.style.zIndex = "9999999999999";
            overlay.style.pointerEvents = "none";
            overlay.style.left = "0";
            overlay.style.top = "0";
            overlay.style.width = "100vw";
            overlay.style.height = "100vh";
            overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
            overlay.style.overflow = "hidden";
            const imageBox = document.createElement("div");
            imageBox.style.position = "relative";
            overlay.appendChild(imageBox);
            image2 = document.createElement("img");
            imageBox.appendChild(image2);
            container = document.createElement("div");
            container.style.position = "absolute";
            container.style.left = "0";
            container.style.top = "0";
            imageBox.appendChild(container);
            const style = document.createElement("style");
            style.innerHTML = ".__vuedevtools_no-scroll { overflow: hidden; }";
            document.head.appendChild(style);
          }
          function showElement() {
            if (!overlay.parentNode) {
              document.body.appendChild(overlay);
              document.body.classList.add("__vuedevtools_no-scroll");
            }
          }
          function hideElement() {
            if (overlay && overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
              document.body.classList.remove("__vuedevtools_no-scroll");
              clearContent();
            }
          }
          function clearContent() {
            while (container.firstChild) {
              container.removeChild(container.lastChild);
            }
          }
        }
      ),
      /***/
      "../app-backend-core/lib/timeline.js": (
        /*!*******************************************!*\
          !*** ../app-backend-core/lib/timeline.js ***!
          \*******************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.sendTimelineLayerEvents = exports.removeLayersForApp = exports.sendTimelineEventData = exports.clearTimeline = exports.perfTimeDiff = exports.dateThreshold = exports.addTimelineEvent = exports.sendTimelineLayers = exports.addBuiltinLayers = exports.setupTimeline = void 0;
          const shared_utils_1 = __webpack_require__2(
            /*! @vue-devtools/shared-utils */
            "../shared-utils/lib/index.js"
          );
          const devtools_api_1 = __webpack_require__2(
            /*! @vue/devtools-api */
            "../api/lib/esm/index.js"
          );
          const global_hook_1 = __webpack_require__2(
            /*! ./global-hook */
            "../app-backend-core/lib/global-hook.js"
          );
          const app_1 = __webpack_require__2(
            /*! ./app */
            "../app-backend-core/lib/app.js"
          );
          const timeline_builtins_1 = __webpack_require__2(
            /*! ./timeline-builtins */
            "../app-backend-core/lib/timeline-builtins.js"
          );
          function setupTimeline(ctx) {
            setupBuiltinLayers(ctx);
          }
          exports.setupTimeline = setupTimeline;
          function addBuiltinLayers(appRecord, ctx) {
            for (const layerDef of timeline_builtins_1.builtinLayers) {
              ctx.timelineLayers.push({
                ...layerDef,
                appRecord,
                plugin: null,
                events: []
              });
            }
          }
          exports.addBuiltinLayers = addBuiltinLayers;
          function setupBuiltinLayers(ctx) {
            if (shared_utils_1.isBrowser) {
              ["mousedown", "mouseup", "click", "dblclick"].forEach((eventType) => {
                window.addEventListener(eventType, async (event) => {
                  await addTimelineEvent({
                    layerId: "mouse",
                    event: {
                      time: (0, devtools_api_1.now)(),
                      data: {
                        type: eventType,
                        x: event.clientX,
                        y: event.clientY
                      },
                      title: eventType
                    }
                  }, null, ctx);
                }, {
                  capture: true,
                  passive: true
                });
              });
              ["keyup", "keydown", "keypress"].forEach((eventType) => {
                window.addEventListener(eventType, async (event) => {
                  await addTimelineEvent({
                    layerId: "keyboard",
                    event: {
                      time: (0, devtools_api_1.now)(),
                      data: {
                        type: eventType,
                        key: event.key,
                        ctrlKey: event.ctrlKey,
                        shiftKey: event.shiftKey,
                        altKey: event.altKey,
                        metaKey: event.metaKey
                      },
                      title: event.key
                    }
                  }, null, ctx);
                }, {
                  capture: true,
                  passive: true
                });
              });
            }
            global_hook_1.hook.on(shared_utils_1.HookEvents.COMPONENT_EMIT, async (app, instance, event, params) => {
              try {
                if (!shared_utils_1.SharedData.componentEventsEnabled)
                  return;
                const appRecord = await (0, app_1.getAppRecord)(app, ctx);
                const componentId = `${appRecord.id}:${instance.uid}`;
                const componentDisplay = await appRecord.backend.api.getComponentName(instance) || "<i>Unknown Component</i>";
                await addTimelineEvent({
                  layerId: "component-event",
                  event: {
                    time: (0, devtools_api_1.now)(),
                    data: {
                      component: {
                        _custom: {
                          type: "component-definition",
                          display: componentDisplay
                        }
                      },
                      event,
                      params
                    },
                    title: event,
                    subtitle: `by ${componentDisplay}`,
                    meta: {
                      componentId,
                      bounds: await appRecord.backend.api.getComponentBounds(instance)
                    }
                  }
                }, app, ctx);
              } catch (e) {
                if (shared_utils_1.SharedData.debugInfo) {
                  console.error(e);
                }
              }
            });
          }
          async function sendTimelineLayers(ctx) {
            var _a, _b;
            const layers = [];
            for (const layer of ctx.timelineLayers) {
              try {
                layers.push({
                  id: layer.id,
                  label: layer.label,
                  color: layer.color,
                  appId: (_a = layer.appRecord) === null || _a === void 0 ? void 0 : _a.id,
                  pluginId: (_b = layer.plugin) === null || _b === void 0 ? void 0 : _b.descriptor.id,
                  groupsOnly: layer.groupsOnly,
                  skipScreenshots: layer.skipScreenshots,
                  ignoreNoDurationGroups: layer.ignoreNoDurationGroups
                });
              } catch (e) {
                if (shared_utils_1.SharedData.debugInfo) {
                  console.error(e);
                }
              }
            }
            ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_TIMELINE_LAYER_LIST, {
              layers
            });
          }
          exports.sendTimelineLayers = sendTimelineLayers;
          async function addTimelineEvent(options, app, ctx) {
            const appId = app ? (0, app_1.getAppRecordId)(app) : null;
            const isAllApps = options.all || !app || appId == null;
            const id = ctx.nextTimelineEventId++;
            const eventData = {
              id,
              ...options,
              all: isAllApps
            };
            ctx.timelineEventMap.set(eventData.id, eventData);
            ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_TIMELINE_EVENT, {
              appId: eventData.all ? "all" : appId,
              layerId: eventData.layerId,
              event: mapTimelineEvent(eventData)
            });
            const layer = ctx.timelineLayers.find((l2) => {
              var _a;
              return (isAllApps || ((_a = l2.appRecord) === null || _a === void 0 ? void 0 : _a.options.app) === app) && l2.id === options.layerId;
            });
            if (layer) {
              layer.events.push(eventData);
            } else if (shared_utils_1.SharedData.debugInfo) {
              console.warn(`Timeline layer ${options.layerId} not found`);
            }
          }
          exports.addTimelineEvent = addTimelineEvent;
          const initialTime = Date.now();
          exports.dateThreshold = initialTime - 1e6;
          exports.perfTimeDiff = initialTime - (0, devtools_api_1.now)();
          function mapTimelineEvent(eventData) {
            let time = eventData.event.time;
            if ((0, devtools_api_1.isPerformanceSupported)() && time < exports.dateThreshold) {
              time += exports.perfTimeDiff;
            }
            return {
              id: eventData.id,
              time: Math.round(time * 1e3),
              logType: eventData.event.logType,
              groupId: eventData.event.groupId,
              title: eventData.event.title,
              subtitle: eventData.event.subtitle
            };
          }
          async function clearTimeline(ctx) {
            ctx.timelineEventMap.clear();
            for (const layer of ctx.timelineLayers) {
              layer.events = [];
            }
            for (const backend of ctx.backends) {
              await backend.api.clearTimeline();
            }
          }
          exports.clearTimeline = clearTimeline;
          async function sendTimelineEventData(id, ctx) {
            let data = null;
            const eventData = ctx.timelineEventMap.get(id);
            if (eventData) {
              data = await ctx.currentAppRecord.backend.api.inspectTimelineEvent(eventData, ctx.currentAppRecord.options.app);
              data = (0, shared_utils_1.stringify)(data);
            } else if (shared_utils_1.SharedData.debugInfo) {
              console.warn(`Event ${id} not found`, ctx.timelineEventMap.keys());
            }
            ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_TIMELINE_EVENT_DATA, {
              eventId: id,
              data
            });
          }
          exports.sendTimelineEventData = sendTimelineEventData;
          function removeLayersForApp(app, ctx) {
            const layers = ctx.timelineLayers.filter((l2) => {
              var _a;
              return ((_a = l2.appRecord) === null || _a === void 0 ? void 0 : _a.options.app) === app;
            });
            for (const layer of layers) {
              const index2 = ctx.timelineLayers.indexOf(layer);
              if (index2 !== -1)
                ctx.timelineLayers.splice(index2, 1);
              for (const e of layer.events) {
                ctx.timelineEventMap.delete(e.id);
              }
            }
          }
          exports.removeLayersForApp = removeLayersForApp;
          function sendTimelineLayerEvents(appId, layerId, ctx) {
            var _a;
            const app = (_a = ctx.appRecords.find((ar) => ar.id === appId)) === null || _a === void 0 ? void 0 : _a.options.app;
            if (!app)
              return;
            const layer = ctx.timelineLayers.find((l2) => {
              var _a2;
              return ((_a2 = l2.appRecord) === null || _a2 === void 0 ? void 0 : _a2.options.app) === app && l2.id === layerId;
            });
            if (!layer)
              return;
            ctx.bridge.send(shared_utils_1.BridgeEvents.TO_FRONT_TIMELINE_LAYER_LOAD_EVENTS, {
              appId,
              layerId,
              events: layer.events.map((e) => mapTimelineEvent(e))
            });
          }
          exports.sendTimelineLayerEvents = sendTimelineLayerEvents;
        }
      ),
      /***/
      "../app-backend-core/lib/util/queue.js": (
        /*!*********************************************!*\
          !*** ../app-backend-core/lib/util/queue.js ***!
          \*********************************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.JobQueue = void 0;
          class JobQueue {
            constructor() {
              this.jobs = [];
            }
            queue(id, fn) {
              const job = {
                id,
                fn
              };
              return new Promise((resolve) => {
                const onDone = () => {
                  this.currentJob = null;
                  const nextJob = this.jobs.shift();
                  if (nextJob) {
                    nextJob.fn();
                  }
                  resolve();
                };
                const run = () => {
                  this.currentJob = job;
                  return job.fn().then(onDone).catch((e) => {
                    console.error(`Job ${job.id} failed:`);
                    console.error(e);
                  });
                };
                if (this.currentJob) {
                  this.jobs.push({
                    id: job.id,
                    fn: () => run()
                  });
                } else {
                  run();
                }
              });
            }
          }
          exports.JobQueue = JobQueue;
        }
      ),
      /***/
      "../app-backend-core/lib/util/subscriptions.js": (
        /*!*****************************************************!*\
          !*** ../app-backend-core/lib/util/subscriptions.js ***!
          \*****************************************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.isSubscribed = exports.unsubscribe = exports.subscribe = void 0;
          const activeSubs = /* @__PURE__ */ new Map();
          function getSubs(type) {
            let subs = activeSubs.get(type);
            if (!subs) {
              subs = [];
              activeSubs.set(type, subs);
            }
            return subs;
          }
          function subscribe(type, payload) {
            const rawPayload = getRawPayload(payload);
            getSubs(type).push({
              payload,
              rawPayload
            });
          }
          exports.subscribe = subscribe;
          function unsubscribe(type, payload) {
            const rawPayload = getRawPayload(payload);
            const subs = getSubs(type);
            let index2;
            while ((index2 = subs.findIndex((sub) => sub.rawPayload === rawPayload)) !== -1) {
              subs.splice(index2, 1);
            }
          }
          exports.unsubscribe = unsubscribe;
          function getRawPayload(payload) {
            const data = Object.keys(payload).sort().reduce((acc, key) => {
              acc[key] = payload[key];
              return acc;
            }, {});
            return JSON.stringify(data);
          }
          function isSubscribed(type, predicate = () => true) {
            return getSubs(type).some(predicate);
          }
          exports.isSubscribed = isSubscribed;
        }
      ),
      /***/
      "../app-backend-vue3/lib/components/data.js": (
        /*!**************************************************!*\
          !*** ../app-backend-vue3/lib/components/data.js ***!
          \**************************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.getCustomInstanceDetails = exports.editState = exports.getCustomObjectDetails = exports.getInstanceDetails = void 0;
          const util_1 = __webpack_require__2(
            /*! ./util */
            "../app-backend-vue3/lib/components/util.js"
          );
          const shared_utils_1 = __webpack_require__2(
            /*! @vue-devtools/shared-utils */
            "../shared-utils/lib/index.js"
          );
          const util_2 = __webpack_require__2(
            /*! ../util */
            "../app-backend-vue3/lib/util.js"
          );
          const vueBuiltins = ["nextTick", "defineComponent", "defineAsyncComponent", "defineCustomElement", "ref", "computed", "reactive", "readonly", "watchEffect", "watchPostEffect", "watchSyncEffect", "watch", "isRef", "unref", "toRef", "toRefs", "isProxy", "isReactive", "isReadonly", "shallowRef", "triggerRef", "customRef", "shallowReactive", "shallowReadonly", "toRaw", "markRaw", "effectScope", "getCurrentScope", "onScopeDispose", "onMounted", "onUpdated", "onUnmounted", "onBeforeMount", "onBeforeUpdate", "onBeforeUnmount", "onErrorCaptured", "onRenderTracked", "onRenderTriggered", "onActivated", "onDeactivated", "onServerPrefetch", "provide", "inject", "h", "mergeProps", "cloneVNode", "isVNode", "resolveComponent", "resolveDirective", "withDirectives", "withModifiers"];
          function getInstanceDetails(instance, ctx) {
            var _a;
            return {
              id: (0, util_1.getUniqueComponentId)(instance, ctx),
              name: (0, util_1.getInstanceName)(instance),
              file: (_a = instance.type) === null || _a === void 0 ? void 0 : _a.__file,
              state: getInstanceState(instance)
            };
          }
          exports.getInstanceDetails = getInstanceDetails;
          function getInstanceState(instance) {
            const mergedType = resolveMergedOptions(instance);
            return processProps(instance).concat(processState(instance), processSetupState(instance), processComputed(instance, mergedType), processAttrs(instance), processProvide(instance), processInject(instance, mergedType), processRefs(instance));
          }
          function processProps(instance) {
            const propsData = [];
            const propDefinitions = instance.type.props;
            for (let key in instance.props) {
              const propDefinition = propDefinitions ? propDefinitions[key] : null;
              key = (0, shared_utils_1.camelize)(key);
              propsData.push({
                type: "props",
                key,
                value: (0, util_2.returnError)(() => instance.props[key]),
                meta: propDefinition ? {
                  type: propDefinition.type ? getPropType(propDefinition.type) : "any",
                  required: !!propDefinition.required,
                  ...propDefinition.default != null ? {
                    default: propDefinition.default.toString()
                  } : {}
                } : {
                  type: "invalid"
                },
                editable: shared_utils_1.SharedData.editableProps
              });
            }
            return propsData;
          }
          const fnTypeRE = /^(?:function|class) (\w+)/;
          function getPropType(type) {
            if (Array.isArray(type)) {
              return type.map((t2) => getPropType(t2)).join(" or ");
            }
            if (type == null) {
              return "null";
            }
            const match = type.toString().match(fnTypeRE);
            return typeof type === "function" ? match && match[1] || "any" : "any";
          }
          function processState(instance) {
            const type = instance.type;
            const props2 = type.props;
            const getters = type.vuex && type.vuex.getters;
            const computedDefs = type.computed;
            const data = {
              ...instance.data,
              ...instance.renderContext
            };
            return Object.keys(data).filter((key) => !(props2 && key in props2) && !(getters && key in getters) && !(computedDefs && key in computedDefs)).map((key) => ({
              key,
              type: "data",
              value: (0, util_2.returnError)(() => data[key]),
              editable: true
            }));
          }
          function processSetupState(instance) {
            const raw = instance.devtoolsRawSetupState || {};
            return Object.keys(instance.setupState).filter((key) => !vueBuiltins.includes(key) && !key.startsWith("use")).map((key) => {
              var _a, _b, _c, _d;
              const value = (0, util_2.returnError)(() => toRaw(instance.setupState[key]));
              const rawData = raw[key];
              let result;
              let isOther = typeof value === "function" || typeof (value === null || value === void 0 ? void 0 : value.render) === "function" || typeof (value === null || value === void 0 ? void 0 : value.__asyncLoader) === "function";
              if (rawData) {
                const info = getSetupStateInfo(rawData);
                const objectType = info.computed ? "Computed" : info.ref ? "Ref" : info.reactive ? "Reactive" : null;
                const isState = info.ref || info.computed || info.reactive;
                const raw2 = ((_b = (_a = rawData.effect) === null || _a === void 0 ? void 0 : _a.raw) === null || _b === void 0 ? void 0 : _b.toString()) || ((_d = (_c = rawData.effect) === null || _c === void 0 ? void 0 : _c.fn) === null || _d === void 0 ? void 0 : _d.toString());
                if (objectType) {
                  isOther = false;
                }
                result = {
                  ...objectType ? {
                    objectType
                  } : {},
                  ...raw2 ? {
                    raw: raw2
                  } : {},
                  editable: isState && !info.readonly
                };
              }
              const type = isOther ? "setup (other)" : "setup";
              return {
                key,
                value,
                type,
                ...result
              };
            });
          }
          function isRef(raw) {
            return !!raw.__v_isRef;
          }
          function isComputed(raw) {
            return isRef(raw) && !!raw.effect;
          }
          function isReactive(raw) {
            return !!raw.__v_isReactive;
          }
          function isReadOnly(raw) {
            return !!raw.__v_isReadonly;
          }
          function toRaw(value) {
            if (value === null || value === void 0 ? void 0 : value.__v_raw) {
              return value.__v_raw;
            }
            return value;
          }
          function getSetupStateInfo(raw) {
            return {
              ref: isRef(raw),
              computed: isComputed(raw),
              reactive: isReactive(raw),
              readonly: isReadOnly(raw)
            };
          }
          function getCustomObjectDetails(object2, proto) {
            var _a, _b, _c, _d;
            const info = getSetupStateInfo(object2);
            const isState = info.ref || info.computed || info.reactive;
            if (isState) {
              const objectType = info.computed ? "Computed" : info.ref ? "Ref" : info.reactive ? "Reactive" : null;
              const value = toRaw(info.reactive ? object2 : object2._value);
              const raw = ((_b = (_a = object2.effect) === null || _a === void 0 ? void 0 : _a.raw) === null || _b === void 0 ? void 0 : _b.toString()) || ((_d = (_c = object2.effect) === null || _c === void 0 ? void 0 : _c.fn) === null || _d === void 0 ? void 0 : _d.toString());
              return {
                _custom: {
                  type: objectType.toLowerCase(),
                  objectType,
                  value,
                  ...raw ? {
                    tooltip: `<span class="font-mono">${raw}</span>`
                  } : {}
                }
              };
            }
            if (typeof object2.__asyncLoader === "function") {
              return {
                _custom: {
                  type: "component-definition",
                  display: "Async component definition"
                }
              };
            }
          }
          exports.getCustomObjectDetails = getCustomObjectDetails;
          function processComputed(instance, mergedType) {
            const type = mergedType;
            const computed = [];
            const defs = type.computed || {};
            for (const key in defs) {
              const def = defs[key];
              const type2 = typeof def === "function" && def.vuex ? "vuex bindings" : "computed";
              computed.push({
                type: type2,
                key,
                value: (0, util_2.returnError)(() => instance.proxy[key]),
                editable: typeof def.set === "function"
              });
            }
            return computed;
          }
          function processAttrs(instance) {
            return Object.keys(instance.attrs).map((key) => ({
              type: "attrs",
              key,
              value: (0, util_2.returnError)(() => instance.attrs[key])
            }));
          }
          function processProvide(instance) {
            return Reflect.ownKeys(instance.provides).map((key) => ({
              type: "provided",
              key: key.toString(),
              value: (0, util_2.returnError)(() => instance.provides[key])
            }));
          }
          function processInject(instance, mergedType) {
            if (!(mergedType === null || mergedType === void 0 ? void 0 : mergedType.inject))
              return [];
            let keys = [];
            let defaultValue;
            if (Array.isArray(mergedType.inject)) {
              keys = mergedType.inject.map((key) => ({
                key,
                originalKey: key
              }));
            } else {
              keys = Reflect.ownKeys(mergedType.inject).map((key) => {
                const value = mergedType.inject[key];
                let originalKey;
                if (typeof value === "string" || typeof value === "symbol") {
                  originalKey = value;
                } else {
                  originalKey = value.from;
                  defaultValue = value.default;
                }
                return {
                  key,
                  originalKey
                };
              });
            }
            return keys.map(({
              key,
              originalKey
            }) => ({
              type: "injected",
              key: originalKey && key !== originalKey ? `${originalKey.toString()} ➞ ${key.toString()}` : key.toString(),
              value: (0, util_2.returnError)(() => instance.ctx[key] || instance.provides[originalKey] || defaultValue)
            }));
          }
          function processRefs(instance) {
            return Object.keys(instance.refs).map((key) => ({
              type: "refs",
              key,
              value: (0, util_2.returnError)(() => instance.refs[key])
            }));
          }
          function editState({
            componentInstance,
            path,
            state,
            type
          }, stateEditor, ctx) {
            if (!["data", "props", "computed", "setup"].includes(type))
              return;
            let target;
            const targetPath = path.slice();
            if (Object.keys(componentInstance.props).includes(path[0])) {
              target = componentInstance.props;
            } else if (componentInstance.devtoolsRawSetupState && Object.keys(componentInstance.devtoolsRawSetupState).includes(path[0])) {
              target = componentInstance.devtoolsRawSetupState;
              const currentValue = stateEditor.get(componentInstance.devtoolsRawSetupState, path);
              if (currentValue != null) {
                const info = getSetupStateInfo(currentValue);
                if (info.readonly)
                  return;
              }
            } else {
              target = componentInstance.proxy;
            }
            if (target && targetPath) {
              stateEditor.set(target, targetPath, "value" in state ? state.value : void 0, stateEditor.createDefaultSetCallback(state));
            }
          }
          exports.editState = editState;
          function reduceStateList(list) {
            if (!list.length) {
              return void 0;
            }
            return list.reduce((map, item) => {
              const key = item.type || "data";
              const obj = map[key] = map[key] || {};
              obj[item.key] = item.value;
              return map;
            }, {});
          }
          function getCustomInstanceDetails(instance) {
            if (instance._)
              instance = instance._;
            const state = getInstanceState(instance);
            return {
              _custom: {
                type: "component",
                id: instance.__VUE_DEVTOOLS_UID__,
                display: (0, util_1.getInstanceName)(instance),
                tooltip: "Component instance",
                value: reduceStateList(state),
                fields: {
                  abstract: true
                }
              }
            };
          }
          exports.getCustomInstanceDetails = getCustomInstanceDetails;
          function resolveMergedOptions(instance) {
            const raw = instance.type;
            const {
              mixins,
              extends: extendsOptions
            } = raw;
            const globalMixins = instance.appContext.mixins;
            if (!globalMixins.length && !mixins && !extendsOptions)
              return raw;
            const options = {};
            globalMixins.forEach((m2) => mergeOptions(options, m2));
            mergeOptions(options, raw);
            return options;
          }
          function mergeOptions(to, from, instance) {
            if (typeof from === "function") {
              from = from.options;
            }
            if (!from)
              return to;
            const {
              mixins,
              extends: extendsOptions
            } = from;
            extendsOptions && mergeOptions(to, extendsOptions);
            mixins && mixins.forEach((m2) => mergeOptions(to, m2));
            for (const key of ["computed", "inject"]) {
              if (Object.prototype.hasOwnProperty.call(from, key)) {
                if (!to[key]) {
                  to[key] = from[key];
                } else {
                  Object.assign(to[key], from[key]);
                }
              }
            }
            return to;
          }
        }
      ),
      /***/
      "../app-backend-vue3/lib/components/el.js": (
        /*!************************************************!*\
          !*** ../app-backend-vue3/lib/components/el.js ***!
          \************************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.getInstanceOrVnodeRect = exports.getRootElementsFromComponentInstance = exports.getComponentInstanceFromElement = void 0;
          const shared_utils_1 = __webpack_require__2(
            /*! @vue-devtools/shared-utils */
            "../shared-utils/lib/index.js"
          );
          const util_1 = __webpack_require__2(
            /*! ./util */
            "../app-backend-vue3/lib/components/util.js"
          );
          function getComponentInstanceFromElement(element) {
            return element.__vueParentComponent;
          }
          exports.getComponentInstanceFromElement = getComponentInstanceFromElement;
          function getRootElementsFromComponentInstance(instance) {
            if ((0, util_1.isFragment)(instance)) {
              return getFragmentRootElements(instance.subTree);
            }
            if (!instance.subTree)
              return [];
            return [instance.subTree.el];
          }
          exports.getRootElementsFromComponentInstance = getRootElementsFromComponentInstance;
          function getFragmentRootElements(vnode) {
            if (!vnode.children)
              return [];
            const list = [];
            for (let i2 = 0, l2 = vnode.children.length; i2 < l2; i2++) {
              const childVnode = vnode.children[i2];
              if (childVnode.component) {
                list.push(...getRootElementsFromComponentInstance(childVnode.component));
              } else if (childVnode.el) {
                list.push(childVnode.el);
              }
            }
            return list;
          }
          function getInstanceOrVnodeRect(instance) {
            const el = instance.subTree.el;
            if (!shared_utils_1.isBrowser) {
              return;
            }
            if (!(0, shared_utils_1.inDoc)(el)) {
              return;
            }
            if ((0, util_1.isFragment)(instance)) {
              return addIframePosition(getFragmentRect(instance.subTree), getElWindow(el));
            } else if (el.nodeType === 1) {
              return addIframePosition(el.getBoundingClientRect(), getElWindow(el));
            } else if (instance.subTree.component) {
              return getInstanceOrVnodeRect(instance.subTree.component);
            }
          }
          exports.getInstanceOrVnodeRect = getInstanceOrVnodeRect;
          function createRect() {
            const rect = {
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              get width() {
                return rect.right - rect.left;
              },
              get height() {
                return rect.bottom - rect.top;
              }
            };
            return rect;
          }
          function mergeRects(a2, b2) {
            if (!a2.top || b2.top < a2.top) {
              a2.top = b2.top;
            }
            if (!a2.bottom || b2.bottom > a2.bottom) {
              a2.bottom = b2.bottom;
            }
            if (!a2.left || b2.left < a2.left) {
              a2.left = b2.left;
            }
            if (!a2.right || b2.right > a2.right) {
              a2.right = b2.right;
            }
            return a2;
          }
          let range2;
          function getTextRect(node) {
            if (!shared_utils_1.isBrowser)
              return;
            if (!range2)
              range2 = document.createRange();
            range2.selectNode(node);
            return range2.getBoundingClientRect();
          }
          function getFragmentRect(vnode) {
            const rect = createRect();
            if (!vnode.children)
              return rect;
            for (let i2 = 0, l2 = vnode.children.length; i2 < l2; i2++) {
              const childVnode = vnode.children[i2];
              let childRect;
              if (childVnode.component) {
                childRect = getInstanceOrVnodeRect(childVnode.component);
              } else if (childVnode.el) {
                const el = childVnode.el;
                if (el.nodeType === 1 || el.getBoundingClientRect) {
                  childRect = el.getBoundingClientRect();
                } else if (el.nodeType === 3 && el.data.trim()) {
                  childRect = getTextRect(el);
                }
              }
              if (childRect) {
                mergeRects(rect, childRect);
              }
            }
            return rect;
          }
          function getElWindow(el) {
            return el.ownerDocument.defaultView;
          }
          function addIframePosition(bounds, win) {
            if (win.__VUE_DEVTOOLS_IFRAME__) {
              const rect = mergeRects(createRect(), bounds);
              const iframeBounds = win.__VUE_DEVTOOLS_IFRAME__.getBoundingClientRect();
              rect.top += iframeBounds.top;
              rect.bottom += iframeBounds.top;
              rect.left += iframeBounds.left;
              rect.right += iframeBounds.left;
              if (win.parent) {
                return addIframePosition(rect, win.parent);
              }
              return rect;
            }
            return bounds;
          }
        }
      ),
      /***/
      "../app-backend-vue3/lib/components/filter.js": (
        /*!****************************************************!*\
          !*** ../app-backend-vue3/lib/components/filter.js ***!
          \****************************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.ComponentFilter = void 0;
          const shared_utils_1 = __webpack_require__2(
            /*! @vue-devtools/shared-utils */
            "../shared-utils/lib/index.js"
          );
          const util_1 = __webpack_require__2(
            /*! ./util */
            "../app-backend-vue3/lib/components/util.js"
          );
          class ComponentFilter {
            constructor(filter) {
              this.filter = filter || "";
            }
            /**
             * Check if an instance is qualified.
             *
             * @param {Vue|Vnode} instance
             * @return {Boolean}
             */
            isQualified(instance) {
              const name = (0, util_1.getInstanceName)(instance);
              return (0, shared_utils_1.classify)(name).toLowerCase().indexOf(this.filter) > -1 || (0, shared_utils_1.kebabize)(name).toLowerCase().indexOf(this.filter) > -1;
            }
          }
          exports.ComponentFilter = ComponentFilter;
        }
      ),
      /***/
      "../app-backend-vue3/lib/components/tree.js": (
        /*!**************************************************!*\
          !*** ../app-backend-vue3/lib/components/tree.js ***!
          \**************************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.ComponentWalker = void 0;
          const util_1 = __webpack_require__2(
            /*! ./util */
            "../app-backend-vue3/lib/components/util.js"
          );
          const filter_1 = __webpack_require__2(
            /*! ./filter */
            "../app-backend-vue3/lib/components/filter.js"
          );
          const el_1 = __webpack_require__2(
            /*! ./el */
            "../app-backend-vue3/lib/components/el.js"
          );
          class ComponentWalker {
            constructor(maxDepth, filter, recursively, api, ctx) {
              this.ctx = ctx;
              this.api = api;
              this.maxDepth = maxDepth;
              this.recursively = recursively;
              this.componentFilter = new filter_1.ComponentFilter(filter);
              this.uniAppPageNames = ["Page", "KeepAlive", "AsyncComponentWrapper", "BaseTransition", "Transition"];
            }
            getComponentTree(instance) {
              this.captureIds = /* @__PURE__ */ new Map();
              return this.findQualifiedChildren(instance, 0);
            }
            getComponentParents(instance) {
              this.captureIds = /* @__PURE__ */ new Map();
              const parents = [];
              this.captureId(instance);
              let parent = instance;
              {
                while (parent = parent.parent) {
                  this.captureId(parent);
                  parents.push(parent);
                }
              }
              return parents;
            }
            /**
             * Find qualified children from a single instance.
             * If the instance itself is qualified, just return itself.
             * This is ok because [].concat works in both cases.
             *
             * @param {Vue|Vnode} instance
             * @return {Vue|Array}
             */
            async findQualifiedChildren(instance, depth) {
              var _a;
              if (this.componentFilter.isQualified(instance) && !((_a = instance.type.devtools) === null || _a === void 0 ? void 0 : _a.hide)) {
                return [await this.capture(instance, null, depth)];
              } else if (instance.subTree) {
                const list = this.isKeepAlive(instance) ? this.getKeepAliveCachedInstances(instance) : this.getInternalInstanceChildrenByInstance(instance);
                return this.findQualifiedChildrenFromList(list, depth);
              } else {
                return [];
              }
            }
            /**
             * Iterate through an array of instances and flatten it into
             * an array of qualified instances. This is a depth-first
             * traversal - e.g. if an instance is not matched, we will
             * recursively go deeper until a qualified child is found.
             *
             * @param {Array} instances
             * @return {Array}
             */
            async findQualifiedChildrenFromList(instances, depth) {
              instances = instances.filter((child) => {
                var _a;
                return !(0, util_1.isBeingDestroyed)(child) && !((_a = child.type.devtools) === null || _a === void 0 ? void 0 : _a.hide);
              });
              if (!this.componentFilter.filter) {
                return Promise.all(instances.map((child, index2, list) => this.capture(child, list, depth)));
              } else {
                return Array.prototype.concat.apply([], await Promise.all(instances.map((i2) => this.findQualifiedChildren(i2, depth))));
              }
            }
            /**
             * fixed by xxxxxx
             * @param instance
             * @param suspense
             * @returns
             */
            getInternalInstanceChildrenByInstance(instance, suspense = null) {
              if (instance.ctx.$children) {
                return instance.ctx.$children.map((proxy) => proxy.$);
              }
              return this.getInternalInstanceChildren(instance.subTree, suspense);
            }
            /**
             * Get children from a component instance.
             */
            getInternalInstanceChildren(subTree, suspense = null) {
              const list = [];
              if (subTree) {
                if (subTree.component) {
                  this.getInstanceChildrenBySubTreeComponent(list, subTree, suspense);
                } else if (subTree.suspense) {
                  const suspenseKey = !subTree.suspense.isInFallback ? "suspense default" : "suspense fallback";
                  list.push(...this.getInternalInstanceChildren(subTree.suspense.activeBranch, {
                    ...subTree.suspense,
                    suspenseKey
                  }));
                } else if (Array.isArray(subTree.children)) {
                  subTree.children.forEach((childSubTree) => {
                    if (childSubTree.component) {
                      this.getInstanceChildrenBySubTreeComponent(list, childSubTree, suspense);
                    } else {
                      list.push(...this.getInternalInstanceChildren(childSubTree, suspense));
                    }
                  });
                }
              }
              return list.filter((child) => {
                var _a;
                return !(0, util_1.isBeingDestroyed)(child) && !((_a = child.type.devtools) === null || _a === void 0 ? void 0 : _a.hide);
              });
            }
            /**
             * getInternalInstanceChildren by subTree component for uni-app defineSystemComponent
             */
            getInstanceChildrenBySubTreeComponent(list, subTree, suspense) {
              if (subTree.type.__reserved || this.uniAppPageNames.includes(subTree.type.name)) {
                list.push(...this.getInternalInstanceChildren(subTree.component.subTree));
              } else {
                !suspense ? list.push(subTree.component) : list.push({
                  ...subTree.component,
                  suspense
                });
              }
            }
            captureId(instance) {
              if (!instance)
                return null;
              const id = instance.__VUE_DEVTOOLS_UID__ != null ? instance.__VUE_DEVTOOLS_UID__ : (0, util_1.getUniqueComponentId)(instance, this.ctx);
              instance.__VUE_DEVTOOLS_UID__ = id;
              if (this.captureIds.has(id)) {
                return;
              } else {
                this.captureIds.set(id, void 0);
              }
              this.mark(instance);
              return id;
            }
            /**
             * Capture the meta information of an instance. (recursive)
             *
             * @param {Vue} instance
             * @return {Object}
             */
            async capture(instance, list, depth) {
              var _b;
              if (!instance)
                return null;
              const id = this.captureId(instance);
              const name = (0, util_1.getInstanceName)(instance);
              const children = this.getInternalInstanceChildrenByInstance(instance).filter((child) => !(0, util_1.isBeingDestroyed)(child));
              const parents = this.getComponentParents(instance) || [];
              const inactive = !!instance.isDeactivated || parents.some((parent) => parent.isDeactivated);
              const treeNode = {
                uid: instance.uid,
                id,
                name,
                renderKey: (0, util_1.getRenderKey)(instance.vnode ? instance.vnode.key : null),
                inactive,
                hasChildren: !!children.length,
                children: [],
                isFragment: (0, util_1.isFragment)(instance),
                tags: typeof instance.type !== "function" ? [] : [{
                  label: "functional",
                  textColor: 5592405,
                  backgroundColor: 15658734
                }],
                autoOpen: this.recursively
              };
              {
                treeNode.route = instance.attrs.__pagePath || "";
              }
              if (depth < this.maxDepth || instance.type.__isKeepAlive || parents.some((parent) => parent.type.__isKeepAlive)) {
                treeNode.children = await Promise.all(children.map((child, index2, list2) => this.capture(child, list2, depth + 1)).filter(Boolean));
              }
              if (this.isKeepAlive(instance)) {
                const cachedComponents = this.getKeepAliveCachedInstances(instance);
                const childrenIds = children.map((child) => child.__VUE_DEVTOOLS_UID__);
                for (const cachedChild of cachedComponents) {
                  if (!childrenIds.includes(cachedChild.__VUE_DEVTOOLS_UID__)) {
                    const node = await this.capture({
                      ...cachedChild,
                      isDeactivated: true
                    }, null, depth + 1);
                    if (node) {
                      treeNode.children.push(node);
                    }
                  }
                }
              }
              const rootElements = (0, el_1.getRootElementsFromComponentInstance)(instance);
              const firstElement = rootElements[0];
              if (firstElement === null || firstElement === void 0 ? void 0 : firstElement.parentElement) {
                const parentInstance = instance.parent;
                const parentRootElements = parentInstance ? (0, el_1.getRootElementsFromComponentInstance)(parentInstance) : [];
                let el = firstElement;
                const indexList = [];
                do {
                  indexList.push(Array.from(el.parentElement.childNodes).indexOf(el));
                  el = el.parentElement;
                } while (el.parentElement && parentRootElements.length && !parentRootElements.includes(el));
                treeNode.domOrder = indexList.reverse();
              } else {
                treeNode.domOrder = [-1];
              }
              if ((_b = instance.suspense) === null || _b === void 0 ? void 0 : _b.suspenseKey) {
                treeNode.tags.push({
                  label: instance.suspense.suspenseKey,
                  backgroundColor: 14979812,
                  textColor: 16777215
                });
                this.mark(instance, true);
              }
              return this.api.visitComponentTree(instance, treeNode, this.componentFilter.filter, this.ctx.currentAppRecord.options.app);
            }
            /**
             * Mark an instance as captured and store it in the instance map.
             *
             * @param {Vue} instance
             */
            mark(instance, force = false) {
              const instanceMap = this.ctx.currentAppRecord.instanceMap;
              if (force || !instanceMap.has(instance.__VUE_DEVTOOLS_UID__)) {
                instanceMap.set(instance.__VUE_DEVTOOLS_UID__, instance);
              }
            }
            isKeepAlive(instance) {
              return instance.type.__isKeepAlive && instance.__v_cache;
            }
            getKeepAliveCachedInstances(instance) {
              return Array.from(instance.__v_cache.values()).map((vnode) => vnode.component).filter(Boolean);
            }
          }
          exports.ComponentWalker = ComponentWalker;
        }
      ),
      /***/
      "../app-backend-vue3/lib/components/util.js": (
        /*!**************************************************!*\
          !*** ../app-backend-vue3/lib/components/util.js ***!
          \**************************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.getComponentInstances = exports.getRenderKey = exports.getUniqueComponentId = exports.getInstanceName = exports.isFragment = exports.getAppRecord = exports.isBeingDestroyed = void 0;
          const shared_utils_1 = __webpack_require__2(
            /*! @vue-devtools/shared-utils */
            "../shared-utils/lib/index.js"
          );
          const util_1 = __webpack_require__2(
            /*! ../util */
            "../app-backend-vue3/lib/util.js"
          );
          function isBeingDestroyed(instance) {
            return instance._isBeingDestroyed || instance.isUnmounted;
          }
          exports.isBeingDestroyed = isBeingDestroyed;
          function getAppRecord(instance) {
            if (instance.root) {
              return instance.appContext.app.__VUE_DEVTOOLS_APP_RECORD__;
            }
          }
          exports.getAppRecord = getAppRecord;
          function isFragment(instance) {
            var _a;
            const appRecord = getAppRecord(instance);
            if (appRecord) {
              return appRecord.options.types.Fragment === ((_a = instance.subTree) === null || _a === void 0 ? void 0 : _a.type);
            }
          }
          exports.isFragment = isFragment;
          function getInstanceName(instance) {
            var _a, _b, _c;
            const name = getComponentTypeName(instance.type || {});
            if (name)
              return name;
            if (isAppRoot(instance))
              return "Root";
            for (const key in (_b = (_a = instance.parent) === null || _a === void 0 ? void 0 : _a.type) === null || _b === void 0 ? void 0 : _b.components) {
              if (instance.parent.type.components[key] === instance.type)
                return saveComponentName(instance, key);
            }
            for (const key in (_c = instance.appContext) === null || _c === void 0 ? void 0 : _c.components) {
              if (instance.appContext.components[key] === instance.type)
                return saveComponentName(instance, key);
            }
            return "Anonymous Component";
          }
          exports.getInstanceName = getInstanceName;
          function saveComponentName(instance, key) {
            instance.type.__vdevtools_guessedName = key;
            return key;
          }
          function getComponentTypeName(options) {
            const name = options.name || options._componentTag || options.__vdevtools_guessedName;
            if (name) {
              return name;
            }
            const file = options.__file;
            if (file) {
              return (0, shared_utils_1.classify)((0, util_1.basename)(file, ".vue"));
            }
          }
          function isAppRoot(instance) {
            return instance.ctx.$mpType === "app";
          }
          function getUniqueComponentId(instance, ctx) {
            const appId = instance.appContext.app.__VUE_DEVTOOLS_APP_RECORD_ID__;
            const instanceId = isAppRoot(instance) ? "root" : instance.uid;
            return `${appId}:${instanceId}`;
          }
          exports.getUniqueComponentId = getUniqueComponentId;
          function getRenderKey(value) {
            if (value == null)
              return;
            const type = typeof value;
            if (type === "number") {
              return value;
            } else if (type === "string") {
              return `'${value}'`;
            } else if (Array.isArray(value)) {
              return "Array";
            } else {
              return "Object";
            }
          }
          exports.getRenderKey = getRenderKey;
          function getComponentInstances(app) {
            const appRecord = app.__VUE_DEVTOOLS_APP_RECORD__;
            const appId = appRecord.id.toString();
            return [...appRecord.instanceMap].filter(([key]) => key.split(":")[0] === appId).map(([, instance]) => instance);
          }
          exports.getComponentInstances = getComponentInstances;
        }
      ),
      /***/
      "../app-backend-vue3/lib/index.js": (
        /*!****************************************!*\
          !*** ../app-backend-vue3/lib/index.js ***!
          \****************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.backend = void 0;
          const app_backend_api_1 = __webpack_require__2(
            /*! @vue-devtools/app-backend-api */
            "../app-backend-api/lib/index.js"
          );
          const tree_1 = __webpack_require__2(
            /*! ./components/tree */
            "../app-backend-vue3/lib/components/tree.js"
          );
          const data_1 = __webpack_require__2(
            /*! ./components/data */
            "../app-backend-vue3/lib/components/data.js"
          );
          const util_1 = __webpack_require__2(
            /*! ./components/util */
            "../app-backend-vue3/lib/components/util.js"
          );
          const el_1 = __webpack_require__2(
            /*! ./components/el */
            "../app-backend-vue3/lib/components/el.js"
          );
          const shared_utils_1 = __webpack_require__2(
            /*! @vue-devtools/shared-utils */
            "../shared-utils/lib/index.js"
          );
          exports.backend = (0, app_backend_api_1.defineBackend)({
            frameworkVersion: 3,
            features: [],
            setup(api) {
              api.on.getAppRecordName((payload) => {
                if (payload.app._component) {
                  payload.name = payload.app._component.name;
                }
              });
              api.on.getAppRootInstance((payload) => {
                var _a, _b, _c, _d;
                if (payload.app._instance) {
                  payload.root = payload.app._instance;
                } else if ((_b = (_a = payload.app._container) === null || _a === void 0 ? void 0 : _a._vnode) === null || _b === void 0 ? void 0 : _b.component) {
                  payload.root = (_d = (_c = payload.app._container) === null || _c === void 0 ? void 0 : _c._vnode) === null || _d === void 0 ? void 0 : _d.component;
                }
              });
              api.on.walkComponentTree(async (payload, ctx) => {
                const walker = new tree_1.ComponentWalker(payload.maxDepth, payload.filter, payload.recursively, api, ctx);
                payload.componentTreeData = await walker.getComponentTree(payload.componentInstance);
              });
              api.on.walkComponentParents((payload, ctx) => {
                const walker = new tree_1.ComponentWalker(0, null, false, api, ctx);
                payload.parentInstances = walker.getComponentParents(payload.componentInstance);
              });
              api.on.inspectComponent((payload, ctx) => {
                shared_utils_1.backendInjections.getCustomInstanceDetails = data_1.getCustomInstanceDetails;
                shared_utils_1.backendInjections.getCustomObjectDetails = data_1.getCustomObjectDetails;
                shared_utils_1.backendInjections.instanceMap = ctx.currentAppRecord.instanceMap;
                shared_utils_1.backendInjections.isVueInstance = (val) => val._ && Object.keys(val._).includes("vnode");
                payload.instanceData = (0, data_1.getInstanceDetails)(payload.componentInstance, ctx);
              });
              api.on.getComponentName((payload) => {
                payload.name = (0, util_1.getInstanceName)(payload.componentInstance);
              });
              api.on.getComponentBounds((payload) => {
                payload.bounds = (0, el_1.getInstanceOrVnodeRect)(payload.componentInstance);
              });
              api.on.getElementComponent((payload) => {
                payload.componentInstance = (0, el_1.getComponentInstanceFromElement)(payload.element);
              });
              api.on.getComponentInstances((payload) => {
                payload.componentInstances = (0, util_1.getComponentInstances)(payload.app);
              });
              api.on.getComponentRootElements((payload) => {
                payload.rootElements = (0, el_1.getRootElementsFromComponentInstance)(payload.componentInstance);
              });
              api.on.editComponentState((payload, ctx) => {
                (0, data_1.editState)(payload, api.stateEditor, ctx);
              });
              api.on.getComponentDevtoolsOptions((payload) => {
                payload.options = payload.componentInstance.type.devtools;
              });
              api.on.getComponentRenderCode((payload) => {
                payload.code = !(payload.componentInstance.type instanceof Function) ? payload.componentInstance.render.toString() : payload.componentInstance.type.toString();
              });
              api.on.transformCall((payload) => {
                if (payload.callName === shared_utils_1.HookEvents.COMPONENT_UPDATED) {
                  const component = payload.inArgs[0];
                  payload.outArgs = [component.appContext.app, component.uid, component.parent ? component.parent.uid : void 0, component];
                }
              });
              api.stateEditor.isRef = (value) => !!(value === null || value === void 0 ? void 0 : value.__v_isRef);
              api.stateEditor.getRefValue = (ref) => ref.value;
              api.stateEditor.setRefValue = (ref, value) => {
                ref.value = value;
              };
            }
          });
        }
      ),
      /***/
      "../app-backend-vue3/lib/util.js": (
        /*!***************************************!*\
          !*** ../app-backend-vue3/lib/util.js ***!
          \***************************************/
        /***/
        function(__unused_webpack_module, exports, __webpack_require__2) {
          var __importDefault = this && this.__importDefault || function(mod) {
            return mod && mod.__esModule ? mod : {
              "default": mod
            };
          };
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.returnError = exports.basename = exports.flatten = void 0;
          const path_1 = __importDefault(__webpack_require__2(
            /*! path */
            "../../node_modules/path-browserify/index.js"
          ));
          function flatten(items) {
            return items.reduce((acc, item) => {
              if (item instanceof Array)
                acc.push(...flatten(item));
              else if (item)
                acc.push(item);
              return acc;
            }, []);
          }
          exports.flatten = flatten;
          function basename(filename, ext) {
            return path_1.default.basename(filename.replace(/^[a-zA-Z]:/, "").replace(/\\/g, "/"), ext);
          }
          exports.basename = basename;
          function returnError(cb) {
            try {
              return cb();
            } catch (e) {
              return e;
            }
          }
          exports.returnError = returnError;
        }
      ),
      /***/
      "../shared-utils/lib/backend.js": (
        /*!**************************************!*\
          !*** ../shared-utils/lib/backend.js ***!
          \**************************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.getCatchedGetters = exports.getCustomStoreDetails = exports.getCustomRouterDetails = exports.isVueInstance = exports.getCustomObjectDetails = exports.getCustomInstanceDetails = exports.getInstanceMap = exports.backendInjections = void 0;
          exports.backendInjections = {
            instanceMap: /* @__PURE__ */ new Map(),
            isVueInstance: () => false,
            getCustomInstanceDetails: () => ({}),
            getCustomObjectDetails: () => void 0
          };
          function getInstanceMap() {
            return exports.backendInjections.instanceMap;
          }
          exports.getInstanceMap = getInstanceMap;
          function getCustomInstanceDetails(instance) {
            return exports.backendInjections.getCustomInstanceDetails(instance);
          }
          exports.getCustomInstanceDetails = getCustomInstanceDetails;
          function getCustomObjectDetails(value, proto) {
            return exports.backendInjections.getCustomObjectDetails(value, proto);
          }
          exports.getCustomObjectDetails = getCustomObjectDetails;
          function isVueInstance(value) {
            return exports.backendInjections.isVueInstance(value);
          }
          exports.isVueInstance = isVueInstance;
          function getCustomRouterDetails(router) {
            return {
              _custom: {
                type: "router",
                display: "VueRouter",
                value: {
                  options: router.options,
                  currentRoute: router.currentRoute
                },
                fields: {
                  abstract: true
                }
              }
            };
          }
          exports.getCustomRouterDetails = getCustomRouterDetails;
          function getCustomStoreDetails(store) {
            return {
              _custom: {
                type: "store",
                display: "Store",
                value: {
                  state: store.state,
                  getters: getCatchedGetters(store)
                },
                fields: {
                  abstract: true
                }
              }
            };
          }
          exports.getCustomStoreDetails = getCustomStoreDetails;
          function getCatchedGetters(store) {
            const getters = {};
            const origGetters = store.getters || {};
            const keys = Object.keys(origGetters);
            for (let i2 = 0; i2 < keys.length; i2++) {
              const key = keys[i2];
              Object.defineProperty(getters, key, {
                enumerable: true,
                get: () => {
                  try {
                    return origGetters[key];
                  } catch (e) {
                    return e;
                  }
                }
              });
            }
            return getters;
          }
          exports.getCatchedGetters = getCatchedGetters;
        }
      ),
      /***/
      "../shared-utils/lib/bridge.js": (
        /*!*************************************!*\
          !*** ../shared-utils/lib/bridge.js ***!
          \*************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.Bridge = void 0;
          const events_1 = __webpack_require__2(
            /*! events */
            "../../node_modules/events/events.js"
          );
          const raf_1 = __webpack_require__2(
            /*! ./raf */
            "../shared-utils/lib/raf.js"
          );
          const BATCH_DURATION = 100;
          class Bridge extends events_1.EventEmitter {
            constructor(wall) {
              super();
              this.setMaxListeners(Infinity);
              this.wall = wall;
              wall.listen((messages) => {
                if (Array.isArray(messages)) {
                  messages.forEach((message) => this._emit(message));
                } else {
                  this._emit(messages);
                }
              });
              this._batchingQueue = [];
              this._sendingQueue = [];
              this._receivingQueue = [];
              this._sending = false;
            }
            on(event, listener) {
              const wrappedListener = async (...args) => {
                try {
                  await listener(...args);
                } catch (e) {
                  console.error(`[Bridge] Error in listener for event ${event.toString()} with args:`, args);
                  console.error(e);
                }
              };
              return super.on(event, wrappedListener);
            }
            send(event, payload) {
              this._batchingQueue.push({
                event,
                payload
              });
              if (this._timer == null) {
                this._timer = setTimeout(() => this._flush(), BATCH_DURATION);
              }
            }
            /**
             * Log a message to the devtools background page.
             */
            log(message) {
              this.send("log", message);
            }
            _flush() {
              if (this._batchingQueue.length)
                this._send(this._batchingQueue);
              clearTimeout(this._timer);
              this._timer = null;
              this._batchingQueue = [];
            }
            // @TODO types
            _emit(message) {
              if (typeof message === "string") {
                this.emit(message);
              } else if (message._chunk) {
                this._receivingQueue.push(message._chunk);
                if (message.last) {
                  this.emit(message.event, this._receivingQueue);
                  this._receivingQueue = [];
                }
              } else if (message.event) {
                this.emit(message.event, message.payload);
              }
            }
            // @TODO types
            _send(messages) {
              this._sendingQueue.push(messages);
              this._nextSend();
            }
            _nextSend() {
              if (!this._sendingQueue.length || this._sending)
                return;
              this._sending = true;
              const messages = this._sendingQueue.shift();
              try {
                this.wall.send(messages);
              } catch (err) {
                if (err.message === "Message length exceeded maximum allowed length.") {
                  this._sendingQueue.splice(0, 0, messages.map((message) => [message]));
                }
              }
              this._sending = false;
              (0, raf_1.raf)(() => this._nextSend());
            }
          }
          exports.Bridge = Bridge;
        }
      ),
      /***/
      "../shared-utils/lib/consts.js": (
        /*!*************************************!*\
          !*** ../shared-utils/lib/consts.js ***!
          \*************************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.HookEvents = exports.BridgeSubscriptions = exports.BridgeEvents = exports.BuiltinTabs = void 0;
          (function(BuiltinTabs) {
            BuiltinTabs["COMPONENTS"] = "components";
            BuiltinTabs["TIMELINE"] = "timeline";
            BuiltinTabs["PLUGINS"] = "plugins";
            BuiltinTabs["SETTINGS"] = "settings";
          })(exports.BuiltinTabs || (exports.BuiltinTabs = {}));
          (function(BridgeEvents) {
            BridgeEvents["TO_BACK_SUBSCRIBE"] = "b:subscribe";
            BridgeEvents["TO_BACK_UNSUBSCRIBE"] = "b:unsubscribe";
            BridgeEvents["TO_FRONT_READY"] = "f:ready";
            BridgeEvents["TO_BACK_LOG_DETECTED_VUE"] = "b:log-detected-vue";
            BridgeEvents["TO_BACK_REFRESH"] = "b:refresh";
            BridgeEvents["TO_BACK_TAB_SWITCH"] = "b:tab:switch";
            BridgeEvents["TO_BACK_LOG"] = "b:log";
            BridgeEvents["TO_FRONT_RECONNECTED"] = "f:reconnected";
            BridgeEvents["TO_FRONT_TITLE"] = "f:title";
            BridgeEvents["TO_FRONT_APP_ADD"] = "f:app:add";
            BridgeEvents["TO_BACK_APP_LIST"] = "b:app:list";
            BridgeEvents["TO_FRONT_APP_LIST"] = "f:app:list";
            BridgeEvents["TO_FRONT_APP_REMOVE"] = "f:app:remove";
            BridgeEvents["TO_BACK_APP_SELECT"] = "b:app:select";
            BridgeEvents["TO_FRONT_APP_SELECTED"] = "f:app:selected";
            BridgeEvents["TO_BACK_SCAN_LEGACY_APPS"] = "b:app:scan-legacy";
            BridgeEvents["TO_BACK_COMPONENT_TREE"] = "b:component:tree";
            BridgeEvents["TO_FRONT_COMPONENT_TREE"] = "f:component:tree";
            BridgeEvents["TO_BACK_COMPONENT_SELECTED_DATA"] = "b:component:selected-data";
            BridgeEvents["TO_FRONT_COMPONENT_SELECTED_DATA"] = "f:component:selected-data";
            BridgeEvents["TO_BACK_COMPONENT_EXPAND"] = "b:component:expand";
            BridgeEvents["TO_FRONT_COMPONENT_EXPAND"] = "f:component:expand";
            BridgeEvents["TO_BACK_COMPONENT_SCROLL_TO"] = "b:component:scroll-to";
            BridgeEvents["TO_BACK_COMPONENT_FILTER"] = "b:component:filter";
            BridgeEvents["TO_BACK_COMPONENT_MOUSE_OVER"] = "b:component:mouse-over";
            BridgeEvents["TO_BACK_COMPONENT_MOUSE_OUT"] = "b:component:mouse-out";
            BridgeEvents["TO_BACK_COMPONENT_CONTEXT_MENU_TARGET"] = "b:component:context-menu-target";
            BridgeEvents["TO_BACK_COMPONENT_EDIT_STATE"] = "b:component:edit-state";
            BridgeEvents["TO_BACK_COMPONENT_PICK"] = "b:component:pick";
            BridgeEvents["TO_FRONT_COMPONENT_PICK"] = "f:component:pick";
            BridgeEvents["TO_BACK_COMPONENT_PICK_CANCELED"] = "b:component:pick-canceled";
            BridgeEvents["TO_FRONT_COMPONENT_PICK_CANCELED"] = "f:component:pick-canceled";
            BridgeEvents["TO_BACK_COMPONENT_INSPECT_DOM"] = "b:component:inspect-dom";
            BridgeEvents["TO_FRONT_COMPONENT_INSPECT_DOM"] = "f:component:inspect-dom";
            BridgeEvents["TO_BACK_COMPONENT_RENDER_CODE"] = "b:component:render-code";
            BridgeEvents["TO_FRONT_COMPONENT_RENDER_CODE"] = "f:component:render-code";
            BridgeEvents["TO_FRONT_COMPONENT_UPDATED"] = "f:component:updated";
            BridgeEvents["TO_FRONT_TIMELINE_EVENT"] = "f:timeline:event";
            BridgeEvents["TO_BACK_TIMELINE_LAYER_LIST"] = "b:timeline:layer-list";
            BridgeEvents["TO_FRONT_TIMELINE_LAYER_LIST"] = "f:timeline:layer-list";
            BridgeEvents["TO_FRONT_TIMELINE_LAYER_ADD"] = "f:timeline:layer-add";
            BridgeEvents["TO_BACK_TIMELINE_SHOW_SCREENSHOT"] = "b:timeline:show-screenshot";
            BridgeEvents["TO_BACK_TIMELINE_CLEAR"] = "b:timeline:clear";
            BridgeEvents["TO_BACK_TIMELINE_EVENT_DATA"] = "b:timeline:event-data";
            BridgeEvents["TO_FRONT_TIMELINE_EVENT_DATA"] = "f:timeline:event-data";
            BridgeEvents["TO_BACK_TIMELINE_LAYER_LOAD_EVENTS"] = "b:timeline:layer-load-events";
            BridgeEvents["TO_FRONT_TIMELINE_LAYER_LOAD_EVENTS"] = "f:timeline:layer-load-events";
            BridgeEvents["TO_BACK_TIMELINE_LOAD_MARKERS"] = "b:timeline:load-markers";
            BridgeEvents["TO_FRONT_TIMELINE_LOAD_MARKERS"] = "f:timeline:load-markers";
            BridgeEvents["TO_FRONT_TIMELINE_MARKER"] = "f:timeline:marker";
            BridgeEvents["TO_BACK_DEVTOOLS_PLUGIN_LIST"] = "b:devtools-plugin:list";
            BridgeEvents["TO_FRONT_DEVTOOLS_PLUGIN_LIST"] = "f:devtools-plugin:list";
            BridgeEvents["TO_FRONT_DEVTOOLS_PLUGIN_ADD"] = "f:devtools-plugin:add";
            BridgeEvents["TO_BACK_DEVTOOLS_PLUGIN_SETTING_UPDATED"] = "b:devtools-plugin:setting-updated";
            BridgeEvents["TO_BACK_CUSTOM_INSPECTOR_LIST"] = "b:custom-inspector:list";
            BridgeEvents["TO_FRONT_CUSTOM_INSPECTOR_LIST"] = "f:custom-inspector:list";
            BridgeEvents["TO_FRONT_CUSTOM_INSPECTOR_ADD"] = "f:custom-inspector:add";
            BridgeEvents["TO_BACK_CUSTOM_INSPECTOR_TREE"] = "b:custom-inspector:tree";
            BridgeEvents["TO_FRONT_CUSTOM_INSPECTOR_TREE"] = "f:custom-inspector:tree";
            BridgeEvents["TO_BACK_CUSTOM_INSPECTOR_STATE"] = "b:custom-inspector:state";
            BridgeEvents["TO_FRONT_CUSTOM_INSPECTOR_STATE"] = "f:custom-inspector:state";
            BridgeEvents["TO_BACK_CUSTOM_INSPECTOR_EDIT_STATE"] = "b:custom-inspector:edit-state";
            BridgeEvents["TO_BACK_CUSTOM_INSPECTOR_ACTION"] = "b:custom-inspector:action";
            BridgeEvents["TO_BACK_CUSTOM_INSPECTOR_NODE_ACTION"] = "b:custom-inspector:node-action";
            BridgeEvents["TO_FRONT_CUSTOM_INSPECTOR_SELECT_NODE"] = "f:custom-inspector:select-node";
            BridgeEvents["TO_BACK_CUSTOM_STATE_ACTION"] = "b:custom-state:action";
          })(exports.BridgeEvents || (exports.BridgeEvents = {}));
          (function(BridgeSubscriptions) {
            BridgeSubscriptions["SELECTED_COMPONENT_DATA"] = "component:selected-data";
            BridgeSubscriptions["COMPONENT_TREE"] = "component:tree";
          })(exports.BridgeSubscriptions || (exports.BridgeSubscriptions = {}));
          (function(HookEvents) {
            HookEvents["INIT"] = "init";
            HookEvents["APP_INIT"] = "app:init";
            HookEvents["APP_ADD"] = "app:add";
            HookEvents["APP_UNMOUNT"] = "app:unmount";
            HookEvents["COMPONENT_UPDATED"] = "component:updated";
            HookEvents["COMPONENT_ADDED"] = "component:added";
            HookEvents["COMPONENT_REMOVED"] = "component:removed";
            HookEvents["COMPONENT_EMIT"] = "component:emit";
            HookEvents["COMPONENT_HIGHLIGHT"] = "component:highlight";
            HookEvents["COMPONENT_UNHIGHLIGHT"] = "component:unhighlight";
            HookEvents["SETUP_DEVTOOLS_PLUGIN"] = "devtools-plugin:setup";
            HookEvents["TIMELINE_LAYER_ADDED"] = "timeline:layer-added";
            HookEvents["TIMELINE_EVENT_ADDED"] = "timeline:event-added";
            HookEvents["CUSTOM_INSPECTOR_ADD"] = "custom-inspector:add";
            HookEvents["CUSTOM_INSPECTOR_SEND_TREE"] = "custom-inspector:send-tree";
            HookEvents["CUSTOM_INSPECTOR_SEND_STATE"] = "custom-inspector:send-state";
            HookEvents["CUSTOM_INSPECTOR_SELECT_NODE"] = "custom-inspector:select-node";
            HookEvents["PERFORMANCE_START"] = "perf:start";
            HookEvents["PERFORMANCE_END"] = "perf:end";
            HookEvents["PLUGIN_SETTINGS_SET"] = "plugin:settings:set";
            HookEvents["FLUSH"] = "flush";
            HookEvents["TRACK_UPDATE"] = "_track-update";
            HookEvents["FLASH_UPDATE"] = "_flash-update";
          })(exports.HookEvents || (exports.HookEvents = {}));
        }
      ),
      /***/
      "../shared-utils/lib/edit.js": (
        /*!***********************************!*\
          !*** ../shared-utils/lib/edit.js ***!
          \***********************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.StateEditor = void 0;
          class StateEditor {
            set(object2, path, value, cb = null) {
              const sections = Array.isArray(path) ? path : path.split(".");
              while (sections.length > 1) {
                object2 = object2[sections.shift()];
                if (this.isRef(object2)) {
                  object2 = this.getRefValue(object2);
                }
              }
              const field = sections[0];
              if (cb) {
                cb(object2, field, value);
              } else if (this.isRef(object2[field])) {
                this.setRefValue(object2[field], value);
              } else {
                object2[field] = value;
              }
            }
            get(object2, path) {
              const sections = Array.isArray(path) ? path : path.split(".");
              for (let i2 = 0; i2 < sections.length; i2++) {
                object2 = object2[sections[i2]];
                if (this.isRef(object2)) {
                  object2 = this.getRefValue(object2);
                }
                if (!object2) {
                  return void 0;
                }
              }
              return object2;
            }
            has(object2, path, parent = false) {
              if (typeof object2 === "undefined") {
                return false;
              }
              const sections = Array.isArray(path) ? path.slice() : path.split(".");
              const size = !parent ? 1 : 2;
              while (object2 && sections.length > size) {
                object2 = object2[sections.shift()];
                if (this.isRef(object2)) {
                  object2 = this.getRefValue(object2);
                }
              }
              return object2 != null && Object.prototype.hasOwnProperty.call(object2, sections[0]);
            }
            createDefaultSetCallback(state) {
              return (obj, field, value) => {
                if (state.remove || state.newKey) {
                  if (Array.isArray(obj)) {
                    obj.splice(field, 1);
                  } else {
                    delete obj[field];
                  }
                }
                if (!state.remove) {
                  const target = obj[state.newKey || field];
                  if (this.isRef(target)) {
                    this.setRefValue(target, value);
                  } else {
                    obj[state.newKey || field] = value;
                  }
                }
              };
            }
            isRef(ref) {
              return false;
            }
            setRefValue(ref, value) {
            }
            getRefValue(ref) {
              return ref;
            }
          }
          exports.StateEditor = StateEditor;
        }
      ),
      /***/
      "../shared-utils/lib/env.js": (
        /*!**********************************!*\
          !*** ../shared-utils/lib/env.js ***!
          \**********************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.initEnv = exports.keys = exports.isLinux = exports.isMac = exports.isWindows = exports.isFirefox = exports.isChrome = exports.target = exports.isBrowser = void 0;
          exports.isBrowser = typeof navigator !== "undefined" && typeof window !== "undefined";
          exports.target = exports.isBrowser ? window : typeof globalThis !== "undefined" ? globalThis : typeof commonjsGlobal !== "undefined" ? commonjsGlobal : typeof my !== "undefined" ? my : {};
          exports.isChrome = typeof exports.target.chrome !== "undefined" && !!exports.target.chrome.devtools;
          exports.isFirefox = exports.isBrowser && navigator.userAgent && navigator.userAgent.indexOf("Firefox") > -1;
          exports.isWindows = exports.isBrowser && navigator.platform.indexOf("Win") === 0;
          exports.isMac = exports.isBrowser && navigator.platform === "MacIntel";
          exports.isLinux = exports.isBrowser && navigator.platform.indexOf("Linux") === 0;
          exports.keys = {
            ctrl: exports.isMac ? "&#8984;" : "Ctrl",
            shift: "Shift",
            alt: exports.isMac ? "&#8997;" : "Alt",
            del: "Del",
            enter: "Enter",
            esc: "Esc"
          };
          function initEnv(Vue2) {
            if (Vue2.prototype.hasOwnProperty("$isChrome"))
              return;
            Object.defineProperties(Vue2.prototype, {
              $isChrome: {
                get: () => exports.isChrome
              },
              $isFirefox: {
                get: () => exports.isFirefox
              },
              $isWindows: {
                get: () => exports.isWindows
              },
              $isMac: {
                get: () => exports.isMac
              },
              $isLinux: {
                get: () => exports.isLinux
              },
              $keys: {
                get: () => exports.keys
              }
            });
            if (exports.isWindows)
              document.body.classList.add("platform-windows");
            if (exports.isMac)
              document.body.classList.add("platform-mac");
            if (exports.isLinux)
              document.body.classList.add("platform-linux");
          }
          exports.initEnv = initEnv;
        }
      ),
      /***/
      "../shared-utils/lib/index.js": (
        /*!************************************!*\
          !*** ../shared-utils/lib/index.js ***!
          \************************************/
        /***/
        function(__unused_webpack_module, exports, __webpack_require__2) {
          var __createBinding = this && this.__createBinding || (Object.create ? function(o2, m2, k2, k22) {
            if (k22 === void 0)
              k22 = k2;
            var desc = Object.getOwnPropertyDescriptor(m2, k2);
            if (!desc || ("get" in desc ? !m2.__esModule : desc.writable || desc.configurable)) {
              desc = {
                enumerable: true,
                get: function() {
                  return m2[k2];
                }
              };
            }
            Object.defineProperty(o2, k22, desc);
          } : function(o2, m2, k2, k22) {
            if (k22 === void 0)
              k22 = k2;
            o2[k22] = m2[k2];
          });
          var __exportStar = this && this.__exportStar || function(m2, exports2) {
            for (var p2 in m2)
              if (p2 !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p2))
                __createBinding(exports2, m2, p2);
          };
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          __exportStar(__webpack_require__2(
            /*! ./backend */
            "../shared-utils/lib/backend.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./bridge */
            "../shared-utils/lib/bridge.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./consts */
            "../shared-utils/lib/consts.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./edit */
            "../shared-utils/lib/edit.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./env */
            "../shared-utils/lib/env.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./plugin-permissions */
            "../shared-utils/lib/plugin-permissions.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./plugin-settings */
            "../shared-utils/lib/plugin-settings.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./shared-data */
            "../shared-utils/lib/shared-data.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./shell */
            "../shared-utils/lib/shell.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./storage */
            "../shared-utils/lib/storage.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./transfer */
            "../shared-utils/lib/transfer.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./util */
            "../shared-utils/lib/util.js"
          ), exports);
          __exportStar(__webpack_require__2(
            /*! ./raf */
            "../shared-utils/lib/raf.js"
          ), exports);
        }
      ),
      /***/
      "../shared-utils/lib/plugin-permissions.js": (
        /*!*************************************************!*\
          !*** ../shared-utils/lib/plugin-permissions.js ***!
          \*************************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.setPluginPermission = exports.hasPluginPermission = exports.PluginPermission = void 0;
          const shared_data_1 = __webpack_require__2(
            /*! ./shared-data */
            "../shared-utils/lib/shared-data.js"
          );
          (function(PluginPermission) {
            PluginPermission["ENABLED"] = "enabled";
            PluginPermission["COMPONENTS"] = "components";
            PluginPermission["CUSTOM_INSPECTOR"] = "custom-inspector";
            PluginPermission["TIMELINE"] = "timeline";
          })(exports.PluginPermission || (exports.PluginPermission = {}));
          function hasPluginPermission(pluginId, permission) {
            const result = shared_data_1.SharedData.pluginPermissions[`${pluginId}:${permission}`];
            if (result == null)
              return true;
            return !!result;
          }
          exports.hasPluginPermission = hasPluginPermission;
          function setPluginPermission(pluginId, permission, active) {
            shared_data_1.SharedData.pluginPermissions = {
              ...shared_data_1.SharedData.pluginPermissions,
              [`${pluginId}:${permission}`]: active
            };
          }
          exports.setPluginPermission = setPluginPermission;
        }
      ),
      /***/
      "../shared-utils/lib/plugin-settings.js": (
        /*!**********************************************!*\
          !*** ../shared-utils/lib/plugin-settings.js ***!
          \**********************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.getPluginDefaultSettings = exports.setPluginSettings = exports.getPluginSettings = void 0;
          const shared_data_1 = __webpack_require__2(
            /*! ./shared-data */
            "../shared-utils/lib/shared-data.js"
          );
          function getPluginSettings(pluginId, defaultSettings) {
            var _a;
            return {
              ...defaultSettings !== null && defaultSettings !== void 0 ? defaultSettings : {},
              ...(_a = shared_data_1.SharedData.pluginSettings[pluginId]) !== null && _a !== void 0 ? _a : {}
            };
          }
          exports.getPluginSettings = getPluginSettings;
          function setPluginSettings(pluginId, settings) {
            shared_data_1.SharedData.pluginSettings = {
              ...shared_data_1.SharedData.pluginSettings,
              [pluginId]: settings
            };
          }
          exports.setPluginSettings = setPluginSettings;
          function getPluginDefaultSettings(schema) {
            const result = {};
            if (schema) {
              for (const id in schema) {
                const item = schema[id];
                result[id] = item.defaultValue;
              }
            }
            return result;
          }
          exports.getPluginDefaultSettings = getPluginDefaultSettings;
        }
      ),
      /***/
      "../shared-utils/lib/raf.js": (
        /*!**********************************!*\
          !*** ../shared-utils/lib/raf.js ***!
          \**********************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.raf = void 0;
          let pendingCallbacks = [];
          exports.raf = typeof requestAnimationFrame === "function" ? requestAnimationFrame : typeof setImmediate === "function" ? (fn) => {
            if (!pendingCallbacks.length) {
              setImmediate(() => {
                const now = performance.now();
                const cbs = pendingCallbacks;
                pendingCallbacks = [];
                cbs.forEach((cb) => cb(now));
              });
            }
            pendingCallbacks.push(fn);
          } : function(callback) {
            return setTimeout(function() {
              callback(Date.now());
            }, 1e3 / 60);
          };
        }
      ),
      /***/
      "../shared-utils/lib/shared-data.js": (
        /*!******************************************!*\
          !*** ../shared-utils/lib/shared-data.js ***!
          \******************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.SharedData = exports.watchSharedData = exports.destroySharedData = exports.onSharedDataInit = exports.initSharedData = void 0;
          const storage_1 = __webpack_require__2(
            /*! ./storage */
            "../shared-utils/lib/storage.js"
          );
          const env_1 = __webpack_require__2(
            /*! ./env */
            "../shared-utils/lib/env.js"
          );
          const internalSharedData = {
            openInEditorHost: "/",
            componentNameStyle: "class",
            theme: "auto",
            displayDensity: "low",
            timeFormat: "default",
            recordVuex: true,
            cacheVuexSnapshotsEvery: 50,
            cacheVuexSnapshotsLimit: 10,
            snapshotLoading: false,
            componentEventsEnabled: true,
            performanceMonitoringEnabled: true,
            editableProps: false,
            logDetected: true,
            vuexNewBackend: false,
            vuexAutoload: false,
            vuexGroupGettersByModule: true,
            showMenuScrollTip: true,
            timelineTimeGrid: true,
            timelineScreenshots: true,
            menuStepScrolling: env_1.isMac,
            pluginPermissions: {},
            pluginSettings: {},
            pageConfig: {},
            legacyApps: false,
            trackUpdates: true,
            flashUpdates: false,
            debugInfo: false,
            isBrowser: env_1.isBrowser
          };
          const persisted = ["componentNameStyle", "theme", "displayDensity", "recordVuex", "editableProps", "logDetected", "vuexNewBackend", "vuexAutoload", "vuexGroupGettersByModule", "timeFormat", "showMenuScrollTip", "timelineTimeGrid", "timelineScreenshots", "menuStepScrolling", "pluginPermissions", "pluginSettings", "performanceMonitoringEnabled", "componentEventsEnabled", "trackUpdates", "flashUpdates", "debugInfo"];
          const storageVersion = "6.0.0-alpha.1";
          let bridge;
          let persist = false;
          let data;
          let initRetryInterval;
          let initRetryCount = 0;
          const initCbs = [];
          function initSharedData(params) {
            return new Promise((resolve) => {
              bridge = params.bridge;
              persist = !!params.persist;
              if (persist) {
                {
                  console.log("[shared data] Master init in progress...");
                }
                persisted.forEach((key) => {
                  const value = (0, storage_1.getStorage)(`vue-devtools-${storageVersion}:shared-data:${key}`);
                  if (value !== null) {
                    internalSharedData[key] = value;
                  }
                });
                bridge.on("shared-data:load", () => {
                  Object.keys(internalSharedData).forEach((key) => {
                    sendValue(key, internalSharedData[key]);
                  });
                  bridge.send("shared-data:load-complete");
                });
                bridge.on("shared-data:init-complete", () => {
                  {
                    console.log("[shared data] Master init complete");
                  }
                  clearInterval(initRetryInterval);
                  resolve();
                });
                bridge.send("shared-data:master-init-waiting");
                bridge.on("shared-data:minion-init-waiting", () => {
                  bridge.send("shared-data:master-init-waiting");
                });
                initRetryCount = 0;
                clearInterval(initRetryInterval);
                initRetryInterval = setInterval(() => {
                  {
                    console.log("[shared data] Master init retrying...");
                  }
                  bridge.send("shared-data:master-init-waiting");
                  initRetryCount++;
                  if (initRetryCount > 30) {
                    clearInterval(initRetryInterval);
                    console.error("[shared data] Master init failed");
                  }
                }, 2e3);
              } else {
                bridge.on("shared-data:master-init-waiting", () => {
                  bridge.send("shared-data:load");
                  bridge.once("shared-data:load-complete", () => {
                    bridge.send("shared-data:init-complete");
                    resolve();
                  });
                });
                bridge.send("shared-data:minion-init-waiting");
              }
              data = {
                ...internalSharedData
              };
              if (params.Vue) {
                data = params.Vue.observable(data);
              }
              bridge.on("shared-data:set", ({
                key,
                value
              }) => {
                setValue(key, value);
              });
              initCbs.forEach((cb) => cb());
            });
          }
          exports.initSharedData = initSharedData;
          function onSharedDataInit(cb) {
            initCbs.push(cb);
            return () => {
              const index2 = initCbs.indexOf(cb);
              if (index2 !== -1)
                initCbs.splice(index2, 1);
            };
          }
          exports.onSharedDataInit = onSharedDataInit;
          function destroySharedData() {
            bridge.removeAllListeners("shared-data:set");
            watchers = {};
          }
          exports.destroySharedData = destroySharedData;
          let watchers = {};
          function setValue(key, value) {
            if (persist && persisted.includes(key)) {
              (0, storage_1.setStorage)(`vue-devtools-${storageVersion}:shared-data:${key}`, value);
            }
            const oldValue = data[key];
            data[key] = value;
            const handlers = watchers[key];
            if (handlers) {
              handlers.forEach((h2) => h2(value, oldValue));
            }
            return true;
          }
          function sendValue(key, value) {
            bridge && bridge.send("shared-data:set", {
              key,
              value
            });
          }
          function watchSharedData(prop, handler) {
            const list = watchers[prop] || (watchers[prop] = []);
            list.push(handler);
            return () => {
              const index2 = list.indexOf(handler);
              if (index2 !== -1)
                list.splice(index2, 1);
            };
          }
          exports.watchSharedData = watchSharedData;
          const proxy = {};
          Object.keys(internalSharedData).forEach((key) => {
            Object.defineProperty(proxy, key, {
              configurable: false,
              get: () => data[key],
              set: (value) => {
                sendValue(key, value);
                setValue(key, value);
              }
            });
          });
          exports.SharedData = proxy;
        }
      ),
      /***/
      "../shared-utils/lib/shell.js": (
        /*!************************************!*\
          !*** ../shared-utils/lib/shell.js ***!
          \************************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
        }
      ),
      /***/
      "../shared-utils/lib/storage.js": (
        /*!**************************************!*\
          !*** ../shared-utils/lib/storage.js ***!
          \**************************************/
        /***/
        (__unused_webpack_module, exports, __webpack_require__2) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.clearStorage = exports.removeStorage = exports.setStorage = exports.getStorage = exports.initStorage = void 0;
          const env_1 = __webpack_require__2(
            /*! ./env */
            "../shared-utils/lib/env.js"
          );
          const useStorage = typeof env_1.target.chrome !== "undefined" && typeof env_1.target.chrome.storage !== "undefined";
          let storageData = null;
          function initStorage() {
            return new Promise((resolve) => {
              if (useStorage) {
                env_1.target.chrome.storage.local.get(null, (result) => {
                  storageData = result;
                  resolve();
                });
              } else {
                storageData = {};
                resolve();
              }
            });
          }
          exports.initStorage = initStorage;
          function getStorage(key, defaultValue = null) {
            checkStorage();
            if (useStorage) {
              return getDefaultValue(storageData[key], defaultValue);
            } else {
              try {
                return getDefaultValue(JSON.parse(localStorage.getItem(key)), defaultValue);
              } catch (e) {
              }
            }
          }
          exports.getStorage = getStorage;
          function setStorage(key, val) {
            checkStorage();
            if (useStorage) {
              storageData[key] = val;
              env_1.target.chrome.storage.local.set({
                [key]: val
              });
            } else {
              try {
                localStorage.setItem(key, JSON.stringify(val));
              } catch (e) {
              }
            }
          }
          exports.setStorage = setStorage;
          function removeStorage(key) {
            checkStorage();
            if (useStorage) {
              delete storageData[key];
              env_1.target.chrome.storage.local.remove([key]);
            } else {
              try {
                localStorage.removeItem(key);
              } catch (e) {
              }
            }
          }
          exports.removeStorage = removeStorage;
          function clearStorage() {
            checkStorage();
            if (useStorage) {
              storageData = {};
              env_1.target.chrome.storage.local.clear();
            } else {
              try {
                localStorage.clear();
              } catch (e) {
              }
            }
          }
          exports.clearStorage = clearStorage;
          function checkStorage() {
            if (!storageData) {
              throw new Error("Storage wasn't initialized with 'init()'");
            }
          }
          function getDefaultValue(value, defaultValue) {
            if (value == null) {
              return defaultValue;
            }
            return value;
          }
        }
      ),
      /***/
      "../shared-utils/lib/transfer.js": (
        /*!***************************************!*\
          !*** ../shared-utils/lib/transfer.js ***!
          \***************************************/
        /***/
        (__unused_webpack_module, exports) => {
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.stringifyStrictCircularAutoChunks = exports.parseCircularAutoChunks = exports.stringifyCircularAutoChunks = void 0;
          const MAX_SERIALIZED_SIZE = 512 * 1024;
          function encode2(data, replacer, list, seen) {
            let stored, key, value, i2, l2;
            const seenIndex = seen.get(data);
            if (seenIndex != null) {
              return seenIndex;
            }
            const index2 = list.length;
            const proto = Object.prototype.toString.call(data);
            if (proto === "[object Object]") {
              stored = {};
              seen.set(data, index2);
              list.push(stored);
              const keys = Object.keys(data);
              for (i2 = 0, l2 = keys.length; i2 < l2; i2++) {
                key = keys[i2];
                try {
                  value = data[key];
                  if (replacer)
                    value = replacer.call(data, key, value);
                } catch (e) {
                  value = e;
                }
                stored[key] = encode2(value, replacer, list, seen);
              }
            } else if (proto === "[object Array]") {
              stored = [];
              seen.set(data, index2);
              list.push(stored);
              for (i2 = 0, l2 = data.length; i2 < l2; i2++) {
                try {
                  value = data[i2];
                  if (replacer)
                    value = replacer.call(data, i2, value);
                } catch (e) {
                  value = e;
                }
                stored[i2] = encode2(value, replacer, list, seen);
              }
            } else {
              list.push(data);
            }
            return index2;
          }
          function decode(list, reviver) {
            let i2 = list.length;
            let j2, k2, data, key, value, proto;
            while (i2--) {
              data = list[i2];
              proto = Object.prototype.toString.call(data);
              if (proto === "[object Object]") {
                const keys = Object.keys(data);
                for (j2 = 0, k2 = keys.length; j2 < k2; j2++) {
                  key = keys[j2];
                  value = list[data[key]];
                  if (reviver)
                    value = reviver.call(data, key, value);
                  data[key] = value;
                }
              } else if (proto === "[object Array]") {
                for (j2 = 0, k2 = data.length; j2 < k2; j2++) {
                  value = list[data[j2]];
                  if (reviver)
                    value = reviver.call(data, j2, value);
                  data[j2] = value;
                }
              }
            }
          }
          function stringifyCircularAutoChunks(data, replacer = null, space = null) {
            let result;
            try {
              result = arguments.length === 1 ? JSON.stringify(data) : JSON.stringify(data, replacer, space);
            } catch (e) {
              result = stringifyStrictCircularAutoChunks(data, replacer, space);
            }
            if (result.length > MAX_SERIALIZED_SIZE) {
              const chunkCount = Math.ceil(result.length / MAX_SERIALIZED_SIZE);
              const chunks = [];
              for (let i2 = 0; i2 < chunkCount; i2++) {
                chunks.push(result.slice(i2 * MAX_SERIALIZED_SIZE, (i2 + 1) * MAX_SERIALIZED_SIZE));
              }
              return chunks;
            }
            return result;
          }
          exports.stringifyCircularAutoChunks = stringifyCircularAutoChunks;
          function parseCircularAutoChunks(data, reviver = null) {
            if (Array.isArray(data)) {
              data = data.join("");
            }
            const hasCircular = /^\s/.test(data);
            if (!hasCircular) {
              return arguments.length === 1 ? JSON.parse(data) : JSON.parse(data, reviver);
            } else {
              const list = JSON.parse(data);
              decode(list, reviver);
              return list[0];
            }
          }
          exports.parseCircularAutoChunks = parseCircularAutoChunks;
          function stringifyStrictCircularAutoChunks(data, replacer = null, space = null) {
            const list = [];
            encode2(data, replacer, list, /* @__PURE__ */ new Map());
            return space ? " " + JSON.stringify(list, null, space) : " " + JSON.stringify(list);
          }
          exports.stringifyStrictCircularAutoChunks = stringifyStrictCircularAutoChunks;
        }
      ),
      /***/
      "../shared-utils/lib/util.js": (
        /*!***********************************!*\
          !*** ../shared-utils/lib/util.js ***!
          \***********************************/
        /***/
        function(__unused_webpack_module, exports, __webpack_require__2) {
          var __importDefault = this && this.__importDefault || function(mod) {
            return mod && mod.__esModule ? mod : {
              "default": mod
            };
          };
          Object.defineProperty(exports, "__esModule", {
            value: true
          });
          exports.isEmptyObject = exports.copyToClipboard = exports.escape = exports.openInEditor = exports.focusInput = exports.simpleGet = exports.sortByKey = exports.searchDeepInObject = exports.isPlainObject = exports.revive = exports.parse = exports.getCustomRefDetails = exports.getCustomHTMLElementDetails = exports.getCustomFunctionDetails = exports.getCustomComponentDefinitionDetails = exports.getComponentName = exports.reviveSet = exports.getCustomSetDetails = exports.reviveMap = exports.getCustomMapDetails = exports.stringify = exports.specialTokenToString = exports.MAX_ARRAY_SIZE = exports.MAX_STRING_SIZE = exports.SPECIAL_TOKENS = exports.NAN = exports.NEGATIVE_INFINITY = exports.INFINITY = exports.UNDEFINED = exports.inDoc = exports.getComponentDisplayName = exports.kebabize = exports.camelize = exports.classify = void 0;
          const path_1 = __importDefault(__webpack_require__2(
            /*! path */
            "../../node_modules/path-browserify/index.js"
          ));
          const transfer_1 = __webpack_require__2(
            /*! ./transfer */
            "../shared-utils/lib/transfer.js"
          );
          const backend_1 = __webpack_require__2(
            /*! ./backend */
            "../shared-utils/lib/backend.js"
          );
          const shared_data_1 = __webpack_require__2(
            /*! ./shared-data */
            "../shared-utils/lib/shared-data.js"
          );
          const env_1 = __webpack_require__2(
            /*! ./env */
            "../shared-utils/lib/env.js"
          );
          function cached(fn) {
            const cache = /* @__PURE__ */ Object.create(null);
            return function cachedFn(str) {
              const hit = cache[str];
              return hit || (cache[str] = fn(str));
            };
          }
          const classifyRE = /(?:^|[-_/])(\w)/g;
          exports.classify = cached((str) => {
            return str && ("" + str).replace(classifyRE, toUpper);
          });
          const camelizeRE = /-(\w)/g;
          exports.camelize = cached((str) => {
            return str && str.replace(camelizeRE, toUpper);
          });
          const kebabizeRE = /([a-z0-9])([A-Z])/g;
          exports.kebabize = cached((str) => {
            return str && str.replace(kebabizeRE, (_2, lowerCaseCharacter, upperCaseLetter) => {
              return `${lowerCaseCharacter}-${upperCaseLetter}`;
            }).toLowerCase();
          });
          function toUpper(_2, c2) {
            return c2 ? c2.toUpperCase() : "";
          }
          function getComponentDisplayName(originalName, style = "class") {
            switch (style) {
              case "class":
                return (0, exports.classify)(originalName);
              case "kebab":
                return (0, exports.kebabize)(originalName);
              case "original":
              default:
                return originalName;
            }
          }
          exports.getComponentDisplayName = getComponentDisplayName;
          function inDoc(node) {
            if (!node)
              return false;
            const doc = node.ownerDocument.documentElement;
            const parent = node.parentNode;
            return doc === node || doc === parent || !!(parent && parent.nodeType === 1 && doc.contains(parent));
          }
          exports.inDoc = inDoc;
          exports.UNDEFINED = "__vue_devtool_undefined__";
          exports.INFINITY = "__vue_devtool_infinity__";
          exports.NEGATIVE_INFINITY = "__vue_devtool_negative_infinity__";
          exports.NAN = "__vue_devtool_nan__";
          exports.SPECIAL_TOKENS = {
            true: true,
            false: false,
            undefined: exports.UNDEFINED,
            null: null,
            "-Infinity": exports.NEGATIVE_INFINITY,
            Infinity: exports.INFINITY,
            NaN: exports.NAN
          };
          exports.MAX_STRING_SIZE = 1e4;
          exports.MAX_ARRAY_SIZE = 5e3;
          function specialTokenToString(value) {
            if (value === null) {
              return "null";
            } else if (value === exports.UNDEFINED) {
              return "undefined";
            } else if (value === exports.NAN) {
              return "NaN";
            } else if (value === exports.INFINITY) {
              return "Infinity";
            } else if (value === exports.NEGATIVE_INFINITY) {
              return "-Infinity";
            }
            return false;
          }
          exports.specialTokenToString = specialTokenToString;
          class EncodeCache {
            constructor() {
              this.map = /* @__PURE__ */ new Map();
            }
            /**
             * Returns a result unique to each input data
             * @param {*} data Input data
             * @param {*} factory Function used to create the unique result
             */
            cache(data, factory) {
              const cached2 = this.map.get(data);
              if (cached2) {
                return cached2;
              } else {
                const result = factory(data);
                this.map.set(data, result);
                return result;
              }
            }
            clear() {
              this.map.clear();
            }
          }
          const encodeCache = new EncodeCache();
          class ReviveCache {
            constructor(maxSize) {
              this.maxSize = maxSize;
              this.map = /* @__PURE__ */ new Map();
              this.index = 0;
              this.size = 0;
            }
            cache(value) {
              const currentIndex = this.index;
              this.map.set(currentIndex, value);
              this.size++;
              if (this.size > this.maxSize) {
                this.map.delete(currentIndex - this.size);
                this.size--;
              }
              this.index++;
              return currentIndex;
            }
            read(id) {
              return this.map.get(id);
            }
          }
          const reviveCache = new ReviveCache(1e3);
          const replacers = {
            internal: replacerForInternal,
            user: replaceForUser
          };
          function stringify(data, target = "internal") {
            encodeCache.clear();
            return (0, transfer_1.stringifyCircularAutoChunks)(data, replacers[target]);
          }
          exports.stringify = stringify;
          function replacerForInternal(key) {
            var _a;
            const val = this[key];
            const type = typeof val;
            if (Array.isArray(val)) {
              const l2 = val.length;
              if (l2 > exports.MAX_ARRAY_SIZE) {
                return {
                  _isArray: true,
                  length: l2,
                  items: val.slice(0, exports.MAX_ARRAY_SIZE)
                };
              }
              return val;
            } else if (typeof val === "string") {
              if (val.length > exports.MAX_STRING_SIZE) {
                return val.substring(0, exports.MAX_STRING_SIZE) + `... (${val.length} total length)`;
              } else {
                return val;
              }
            } else if (type === "undefined") {
              return exports.UNDEFINED;
            } else if (val === Infinity) {
              return exports.INFINITY;
            } else if (val === -Infinity) {
              return exports.NEGATIVE_INFINITY;
            } else if (type === "function") {
              return getCustomFunctionDetails(val);
            } else if (type === "symbol") {
              return `[native Symbol ${Symbol.prototype.toString.call(val)}]`;
            } else if (val !== null && type === "object") {
              const proto = Object.prototype.toString.call(val);
              if (proto === "[object Map]") {
                return encodeCache.cache(val, () => getCustomMapDetails(val));
              } else if (proto === "[object Set]") {
                return encodeCache.cache(val, () => getCustomSetDetails(val));
              } else if (proto === "[object RegExp]") {
                return `[native RegExp ${RegExp.prototype.toString.call(val)}]`;
              } else if (proto === "[object Date]") {
                return `[native Date ${Date.prototype.toString.call(val)}]`;
              } else if (proto === "[object Error]") {
                return `[native Error ${val.message}<>${val.stack}]`;
              } else if (val.state && val._vm) {
                return encodeCache.cache(val, () => (0, backend_1.getCustomStoreDetails)(val));
              } else if (val.constructor && val.constructor.name === "VueRouter") {
                return encodeCache.cache(val, () => (0, backend_1.getCustomRouterDetails)(val));
              } else if ((0, backend_1.isVueInstance)(val)) {
                return encodeCache.cache(val, () => (0, backend_1.getCustomInstanceDetails)(val));
              } else if (typeof val.render === "function") {
                return encodeCache.cache(val, () => getCustomComponentDefinitionDetails(val));
              } else if (val.constructor && val.constructor.name === "VNode") {
                return `[native VNode <${val.tag}>]`;
              } else if (typeof HTMLElement !== "undefined" && val instanceof HTMLElement) {
                return encodeCache.cache(val, () => getCustomHTMLElementDetails(val));
              } else if (((_a = val.constructor) === null || _a === void 0 ? void 0 : _a.name) === "Store" && val._wrappedGetters) {
                return `[object Store]`;
              } else if (val.currentRoute) {
                return `[object Router]`;
              }
              const customDetails = (0, backend_1.getCustomObjectDetails)(val, proto);
              if (customDetails != null)
                return customDetails;
            } else if (Number.isNaN(val)) {
              return exports.NAN;
            }
            return sanitize(val);
          }
          function replaceForUser(key) {
            let val = this[key];
            const type = typeof val;
            if ((val === null || val === void 0 ? void 0 : val._custom) && "value" in val._custom) {
              val = val._custom.value;
            }
            if (type !== "object") {
              if (val === exports.UNDEFINED) {
                return void 0;
              } else if (val === exports.INFINITY) {
                return Infinity;
              } else if (val === exports.NEGATIVE_INFINITY) {
                return -Infinity;
              } else if (val === exports.NAN) {
                return NaN;
              }
              return val;
            }
            return sanitize(val);
          }
          function getCustomMapDetails(val) {
            const list = [];
            val.forEach((value, key) => list.push({
              key,
              value
            }));
            return {
              _custom: {
                type: "map",
                display: "Map",
                value: list,
                readOnly: true,
                fields: {
                  abstract: true
                }
              }
            };
          }
          exports.getCustomMapDetails = getCustomMapDetails;
          function reviveMap(val) {
            const result = /* @__PURE__ */ new Map();
            const list = val._custom.value;
            for (let i2 = 0; i2 < list.length; i2++) {
              const {
                key,
                value
              } = list[i2];
              result.set(key, revive(value));
            }
            return result;
          }
          exports.reviveMap = reviveMap;
          function getCustomSetDetails(val) {
            const list = Array.from(val);
            return {
              _custom: {
                type: "set",
                display: `Set[${list.length}]`,
                value: list,
                readOnly: true
              }
            };
          }
          exports.getCustomSetDetails = getCustomSetDetails;
          function reviveSet(val) {
            const result = /* @__PURE__ */ new Set();
            const list = val._custom.value;
            for (let i2 = 0; i2 < list.length; i2++) {
              const value = list[i2];
              result.add(revive(value));
            }
            return result;
          }
          exports.reviveSet = reviveSet;
          function basename(filename, ext) {
            return path_1.default.basename(filename.replace(/^[a-zA-Z]:/, "").replace(/\\/g, "/"), ext);
          }
          function getComponentName(options) {
            const name = options.displayName || options.name || options._componentTag;
            if (name) {
              return name;
            }
            const file = options.__file;
            if (file) {
              return (0, exports.classify)(basename(file, ".vue"));
            }
          }
          exports.getComponentName = getComponentName;
          function getCustomComponentDefinitionDetails(def) {
            let display = getComponentName(def);
            if (display) {
              if (def.name && def.__file) {
                display += ` <span>(${def.__file})</span>`;
              }
            } else {
              display = "<i>Unknown Component</i>";
            }
            return {
              _custom: {
                type: "component-definition",
                display,
                tooltip: "Component definition",
                ...def.__file ? {
                  file: def.__file
                } : {}
              }
            };
          }
          exports.getCustomComponentDefinitionDetails = getCustomComponentDefinitionDetails;
          function getCustomFunctionDetails(func2) {
            let string2 = "";
            let matches = null;
            try {
              string2 = Function.prototype.toString.call(func2);
              matches = String.prototype.match.call(string2, /\([\s\S]*?\)/);
            } catch (e) {
            }
            const match = matches && matches[0];
            const args = typeof match === "string" ? match : "(?)";
            const name = typeof func2.name === "string" ? func2.name : "";
            return {
              _custom: {
                type: "function",
                display: `<span style="opacity:.5;">function</span> ${escape2(name)}${args}`,
                tooltip: string2.trim() ? `<pre>${string2}</pre>` : null,
                _reviveId: reviveCache.cache(func2)
              }
            };
          }
          exports.getCustomFunctionDetails = getCustomFunctionDetails;
          function getCustomHTMLElementDetails(value) {
            try {
              return {
                _custom: {
                  type: "HTMLElement",
                  display: `<span class="opacity-30">&lt;</span><span class="text-blue-500">${value.tagName.toLowerCase()}</span><span class="opacity-30">&gt;</span>`,
                  value: namedNodeMapToObject(value.attributes),
                  actions: [{
                    icon: "input",
                    tooltip: "Log element to console",
                    action: () => {
                      console.log(value);
                    }
                  }]
                }
              };
            } catch (e) {
              return {
                _custom: {
                  type: "HTMLElement",
                  display: `<span class="text-blue-500">${String(value)}</span>`
                }
              };
            }
          }
          exports.getCustomHTMLElementDetails = getCustomHTMLElementDetails;
          function namedNodeMapToObject(map) {
            const result = {};
            const l2 = map.length;
            for (let i2 = 0; i2 < l2; i2++) {
              const node = map.item(i2);
              result[node.name] = node.value;
            }
            return result;
          }
          function getCustomRefDetails(instance, key, ref) {
            let value;
            if (Array.isArray(ref)) {
              value = ref.map((r2) => getCustomRefDetails(instance, key, r2)).map((data) => data.value);
            } else {
              let name;
              if (ref._isVue) {
                name = getComponentName(ref.$options);
              } else {
                name = ref.tagName.toLowerCase();
              }
              value = {
                _custom: {
                  display: `&lt;${name}` + (ref.id ? ` <span class="attr-title">id</span>="${ref.id}"` : "") + (ref.className ? ` <span class="attr-title">class</span>="${ref.className}"` : "") + "&gt;",
                  uid: instance.__VUE_DEVTOOLS_UID__,
                  type: "reference"
                }
              };
            }
            return {
              type: "$refs",
              key,
              value,
              editable: false
            };
          }
          exports.getCustomRefDetails = getCustomRefDetails;
          function parse2(data, revive2 = false) {
            return revive2 ? (0, transfer_1.parseCircularAutoChunks)(data, reviver) : (0, transfer_1.parseCircularAutoChunks)(data);
          }
          exports.parse = parse2;
          const specialTypeRE = /^\[native (\w+) (.*?)(<>((.|\s)*))?\]$/;
          const symbolRE = /^\[native Symbol Symbol\((.*)\)\]$/;
          function reviver(key, val) {
            return revive(val);
          }
          function revive(val) {
            if (val === exports.UNDEFINED) {
              return void 0;
            } else if (val === exports.INFINITY) {
              return Infinity;
            } else if (val === exports.NEGATIVE_INFINITY) {
              return -Infinity;
            } else if (val === exports.NAN) {
              return NaN;
            } else if (val && val._custom) {
              const {
                _custom: custom
              } = val;
              if (custom.type === "component") {
                return (0, backend_1.getInstanceMap)().get(custom.id);
              } else if (custom.type === "map") {
                return reviveMap(val);
              } else if (custom.type === "set") {
                return reviveSet(val);
              } else if (custom._reviveId) {
                return reviveCache.read(custom._reviveId);
              } else {
                return revive(custom.value);
              }
            } else if (symbolRE.test(val)) {
              const [, string2] = symbolRE.exec(val);
              return Symbol.for(string2);
            } else if (specialTypeRE.test(val)) {
              const [, type, string2, , details] = specialTypeRE.exec(val);
              const result = new env_1.target[type](string2);
              if (type === "Error" && details) {
                result.stack = details;
              }
              return result;
            } else {
              return val;
            }
          }
          exports.revive = revive;
          function sanitize(data) {
            if (!isPrimitive(data) && !Array.isArray(data) && !isPlainObject2(data)) {
              return Object.prototype.toString.call(data);
            } else {
              return data;
            }
          }
          function isPlainObject2(obj) {
            return Object.prototype.toString.call(obj) === "[object Object]";
          }
          exports.isPlainObject = isPlainObject2;
          function isPrimitive(data) {
            if (data == null) {
              return true;
            }
            const type = typeof data;
            return type === "string" || type === "number" || type === "boolean";
          }
          function searchDeepInObject(obj, searchTerm) {
            const seen = /* @__PURE__ */ new Map();
            const result = internalSearchObject(obj, searchTerm.toLowerCase(), seen, 0);
            seen.clear();
            return result;
          }
          exports.searchDeepInObject = searchDeepInObject;
          const SEARCH_MAX_DEPTH = 10;
          function internalSearchObject(obj, searchTerm, seen, depth) {
            if (depth > SEARCH_MAX_DEPTH) {
              return false;
            }
            let match = false;
            const keys = Object.keys(obj);
            let key, value;
            for (let i2 = 0; i2 < keys.length; i2++) {
              key = keys[i2];
              value = obj[key];
              match = internalSearchCheck(searchTerm, key, value, seen, depth + 1);
              if (match) {
                break;
              }
            }
            return match;
          }
          function internalSearchArray(array2, searchTerm, seen, depth) {
            if (depth > SEARCH_MAX_DEPTH) {
              return false;
            }
            let match = false;
            let value;
            for (let i2 = 0; i2 < array2.length; i2++) {
              value = array2[i2];
              match = internalSearchCheck(searchTerm, null, value, seen, depth + 1);
              if (match) {
                break;
              }
            }
            return match;
          }
          function internalSearchCheck(searchTerm, key, value, seen, depth) {
            let match = false;
            let result;
            if (key === "_custom") {
              key = value.display;
              value = value.value;
            }
            (result = specialTokenToString(value)) && (value = result);
            if (key && compare(key, searchTerm)) {
              match = true;
              seen.set(value, true);
            } else if (seen.has(value)) {
              match = seen.get(value);
            } else if (Array.isArray(value)) {
              seen.set(value, null);
              match = internalSearchArray(value, searchTerm, seen, depth);
              seen.set(value, match);
            } else if (isPlainObject2(value)) {
              seen.set(value, null);
              match = internalSearchObject(value, searchTerm, seen, depth);
              seen.set(value, match);
            } else if (compare(value, searchTerm)) {
              match = true;
              seen.set(value, true);
            }
            return match;
          }
          function compare(value, searchTerm) {
            return ("" + value).toLowerCase().indexOf(searchTerm) !== -1;
          }
          function sortByKey(state) {
            return state && state.slice().sort((a2, b2) => {
              if (a2.key < b2.key)
                return -1;
              if (a2.key > b2.key)
                return 1;
              return 0;
            });
          }
          exports.sortByKey = sortByKey;
          function simpleGet(object2, path) {
            const sections = Array.isArray(path) ? path : path.split(".");
            for (let i2 = 0; i2 < sections.length; i2++) {
              object2 = object2[sections[i2]];
              if (!object2) {
                return void 0;
              }
            }
            return object2;
          }
          exports.simpleGet = simpleGet;
          function focusInput(el) {
            el.focus();
            el.setSelectionRange(0, el.value.length);
          }
          exports.focusInput = focusInput;
          function openInEditor(file) {
            const fileName = file.replace(/\\/g, "\\\\");
            const src = `fetch('${shared_data_1.SharedData.openInEditorHost}__open-in-editor?file=${encodeURI(file)}').then(response => {
    if (response.ok) {
      console.log('File ${fileName} opened in editor')
    } else {
      const msg = 'Opening component ${fileName} failed'
      const target = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : {}
      if (target.__VUE_DEVTOOLS_TOAST__) {
        target.__VUE_DEVTOOLS_TOAST__(msg, 'error')
      } else {
        console.log('%c' + msg, 'color:red')
      }
      console.log('Check the setup of your project, see https://devtools.vuejs.org/guide/open-in-editor.html')
    }
  })`;
            if (env_1.isChrome) {
              env_1.target.chrome.devtools.inspectedWindow.eval(src);
            } else {
              [eval][0](src);
            }
          }
          exports.openInEditor = openInEditor;
          const ESC = {
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "&": "&amp;"
          };
          function escape2(s2) {
            return s2.replace(/[<>"&]/g, escapeChar);
          }
          exports.escape = escape2;
          function escapeChar(a2) {
            return ESC[a2] || a2;
          }
          function copyToClipboard(state) {
            let text;
            if (typeof state !== "object") {
              text = String(state);
            } else {
              text = stringify(state, "user");
            }
            if (typeof document === "undefined")
              return;
            const dummyTextArea = document.createElement("textarea");
            dummyTextArea.textContent = text;
            document.body.appendChild(dummyTextArea);
            dummyTextArea.select();
            document.execCommand("copy");
            document.body.removeChild(dummyTextArea);
          }
          exports.copyToClipboard = copyToClipboard;
          function isEmptyObject(obj) {
            return obj === exports.UNDEFINED || !obj || Object.keys(obj).length === 0;
          }
          exports.isEmptyObject = isEmptyObject;
        }
      ),
      /***/
      "../../node_modules/events/events.js": (
        /*!*******************************************!*\
          !*** ../../node_modules/events/events.js ***!
          \*******************************************/
        /***/
        (module) => {
          var R2 = typeof Reflect === "object" ? Reflect : null;
          var ReflectApply = R2 && typeof R2.apply === "function" ? R2.apply : function ReflectApply2(target, receiver, args) {
            return Function.prototype.apply.call(target, receiver, args);
          };
          var ReflectOwnKeys;
          if (R2 && typeof R2.ownKeys === "function") {
            ReflectOwnKeys = R2.ownKeys;
          } else if (Object.getOwnPropertySymbols) {
            ReflectOwnKeys = function ReflectOwnKeys2(target) {
              return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
            };
          } else {
            ReflectOwnKeys = function ReflectOwnKeys2(target) {
              return Object.getOwnPropertyNames(target);
            };
          }
          function ProcessEmitWarning(warning) {
            if (console && console.warn)
              console.warn(warning);
          }
          var NumberIsNaN = Number.isNaN || function NumberIsNaN2(value) {
            return value !== value;
          };
          function EventEmitter() {
            EventEmitter.init.call(this);
          }
          module.exports = EventEmitter;
          module.exports.once = once;
          EventEmitter.EventEmitter = EventEmitter;
          EventEmitter.prototype._events = void 0;
          EventEmitter.prototype._eventsCount = 0;
          EventEmitter.prototype._maxListeners = void 0;
          var defaultMaxListeners = 10;
          function checkListener(listener) {
            if (typeof listener !== "function") {
              throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
            }
          }
          Object.defineProperty(EventEmitter, "defaultMaxListeners", {
            enumerable: true,
            get: function() {
              return defaultMaxListeners;
            },
            set: function(arg) {
              if (typeof arg !== "number" || arg < 0 || NumberIsNaN(arg)) {
                throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + ".");
              }
              defaultMaxListeners = arg;
            }
          });
          EventEmitter.init = function() {
            if (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) {
              this._events = /* @__PURE__ */ Object.create(null);
              this._eventsCount = 0;
            }
            this._maxListeners = this._maxListeners || void 0;
          };
          EventEmitter.prototype.setMaxListeners = function setMaxListeners(n2) {
            if (typeof n2 !== "number" || n2 < 0 || NumberIsNaN(n2)) {
              throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n2 + ".");
            }
            this._maxListeners = n2;
            return this;
          };
          function _getMaxListeners(that) {
            if (that._maxListeners === void 0)
              return EventEmitter.defaultMaxListeners;
            return that._maxListeners;
          }
          EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
            return _getMaxListeners(this);
          };
          EventEmitter.prototype.emit = function emit(type) {
            var args = [];
            for (var i2 = 1; i2 < arguments.length; i2++)
              args.push(arguments[i2]);
            var doError = type === "error";
            var events = this._events;
            if (events !== void 0)
              doError = doError && events.error === void 0;
            else if (!doError)
              return false;
            if (doError) {
              var er;
              if (args.length > 0)
                er = args[0];
              if (er instanceof Error) {
                throw er;
              }
              var err = new Error("Unhandled error." + (er ? " (" + er.message + ")" : ""));
              err.context = er;
              throw err;
            }
            var handler = events[type];
            if (handler === void 0)
              return false;
            if (typeof handler === "function") {
              ReflectApply(handler, this, args);
            } else {
              var len = handler.length;
              var listeners = arrayClone(handler, len);
              for (var i2 = 0; i2 < len; ++i2)
                ReflectApply(listeners[i2], this, args);
            }
            return true;
          };
          function _addListener(target, type, listener, prepend) {
            var m2;
            var events;
            var existing;
            checkListener(listener);
            events = target._events;
            if (events === void 0) {
              events = target._events = /* @__PURE__ */ Object.create(null);
              target._eventsCount = 0;
            } else {
              if (events.newListener !== void 0) {
                target.emit(
                  "newListener",
                  type,
                  listener.listener ? listener.listener : listener
                );
                events = target._events;
              }
              existing = events[type];
            }
            if (existing === void 0) {
              existing = events[type] = listener;
              ++target._eventsCount;
            } else {
              if (typeof existing === "function") {
                existing = events[type] = prepend ? [listener, existing] : [existing, listener];
              } else if (prepend) {
                existing.unshift(listener);
              } else {
                existing.push(listener);
              }
              m2 = _getMaxListeners(target);
              if (m2 > 0 && existing.length > m2 && !existing.warned) {
                existing.warned = true;
                var w2 = new Error("Possible EventEmitter memory leak detected. " + existing.length + " " + String(type) + " listeners added. Use emitter.setMaxListeners() to increase limit");
                w2.name = "MaxListenersExceededWarning";
                w2.emitter = target;
                w2.type = type;
                w2.count = existing.length;
                ProcessEmitWarning(w2);
              }
            }
            return target;
          }
          EventEmitter.prototype.addListener = function addListener(type, listener) {
            return _addListener(this, type, listener, false);
          };
          EventEmitter.prototype.on = EventEmitter.prototype.addListener;
          EventEmitter.prototype.prependListener = function prependListener(type, listener) {
            return _addListener(this, type, listener, true);
          };
          function onceWrapper() {
            if (!this.fired) {
              this.target.removeListener(this.type, this.wrapFn);
              this.fired = true;
              if (arguments.length === 0)
                return this.listener.call(this.target);
              return this.listener.apply(this.target, arguments);
            }
          }
          function _onceWrap(target, type, listener) {
            var state = { fired: false, wrapFn: void 0, target, type, listener };
            var wrapped = onceWrapper.bind(state);
            wrapped.listener = listener;
            state.wrapFn = wrapped;
            return wrapped;
          }
          EventEmitter.prototype.once = function once2(type, listener) {
            checkListener(listener);
            this.on(type, _onceWrap(this, type, listener));
            return this;
          };
          EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
            checkListener(listener);
            this.prependListener(type, _onceWrap(this, type, listener));
            return this;
          };
          EventEmitter.prototype.removeListener = function removeListener(type, listener) {
            var list, events, position, i2, originalListener;
            checkListener(listener);
            events = this._events;
            if (events === void 0)
              return this;
            list = events[type];
            if (list === void 0)
              return this;
            if (list === listener || list.listener === listener) {
              if (--this._eventsCount === 0)
                this._events = /* @__PURE__ */ Object.create(null);
              else {
                delete events[type];
                if (events.removeListener)
                  this.emit("removeListener", type, list.listener || listener);
              }
            } else if (typeof list !== "function") {
              position = -1;
              for (i2 = list.length - 1; i2 >= 0; i2--) {
                if (list[i2] === listener || list[i2].listener === listener) {
                  originalListener = list[i2].listener;
                  position = i2;
                  break;
                }
              }
              if (position < 0)
                return this;
              if (position === 0)
                list.shift();
              else {
                spliceOne(list, position);
              }
              if (list.length === 1)
                events[type] = list[0];
              if (events.removeListener !== void 0)
                this.emit("removeListener", type, originalListener || listener);
            }
            return this;
          };
          EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
          EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
            var listeners, events, i2;
            events = this._events;
            if (events === void 0)
              return this;
            if (events.removeListener === void 0) {
              if (arguments.length === 0) {
                this._events = /* @__PURE__ */ Object.create(null);
                this._eventsCount = 0;
              } else if (events[type] !== void 0) {
                if (--this._eventsCount === 0)
                  this._events = /* @__PURE__ */ Object.create(null);
                else
                  delete events[type];
              }
              return this;
            }
            if (arguments.length === 0) {
              var keys = Object.keys(events);
              var key;
              for (i2 = 0; i2 < keys.length; ++i2) {
                key = keys[i2];
                if (key === "removeListener")
                  continue;
                this.removeAllListeners(key);
              }
              this.removeAllListeners("removeListener");
              this._events = /* @__PURE__ */ Object.create(null);
              this._eventsCount = 0;
              return this;
            }
            listeners = events[type];
            if (typeof listeners === "function") {
              this.removeListener(type, listeners);
            } else if (listeners !== void 0) {
              for (i2 = listeners.length - 1; i2 >= 0; i2--) {
                this.removeListener(type, listeners[i2]);
              }
            }
            return this;
          };
          function _listeners(target, type, unwrap) {
            var events = target._events;
            if (events === void 0)
              return [];
            var evlistener = events[type];
            if (evlistener === void 0)
              return [];
            if (typeof evlistener === "function")
              return unwrap ? [evlistener.listener || evlistener] : [evlistener];
            return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
          }
          EventEmitter.prototype.listeners = function listeners(type) {
            return _listeners(this, type, true);
          };
          EventEmitter.prototype.rawListeners = function rawListeners(type) {
            return _listeners(this, type, false);
          };
          EventEmitter.listenerCount = function(emitter, type) {
            if (typeof emitter.listenerCount === "function") {
              return emitter.listenerCount(type);
            } else {
              return listenerCount.call(emitter, type);
            }
          };
          EventEmitter.prototype.listenerCount = listenerCount;
          function listenerCount(type) {
            var events = this._events;
            if (events !== void 0) {
              var evlistener = events[type];
              if (typeof evlistener === "function") {
                return 1;
              } else if (evlistener !== void 0) {
                return evlistener.length;
              }
            }
            return 0;
          }
          EventEmitter.prototype.eventNames = function eventNames() {
            return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
          };
          function arrayClone(arr, n2) {
            var copy = new Array(n2);
            for (var i2 = 0; i2 < n2; ++i2)
              copy[i2] = arr[i2];
            return copy;
          }
          function spliceOne(list, index2) {
            for (; index2 + 1 < list.length; index2++)
              list[index2] = list[index2 + 1];
            list.pop();
          }
          function unwrapListeners(arr) {
            var ret = new Array(arr.length);
            for (var i2 = 0; i2 < ret.length; ++i2) {
              ret[i2] = arr[i2].listener || arr[i2];
            }
            return ret;
          }
          function once(emitter, name) {
            return new Promise(function(resolve, reject) {
              function errorListener(err) {
                emitter.removeListener(name, resolver);
                reject(err);
              }
              function resolver() {
                if (typeof emitter.removeListener === "function") {
                  emitter.removeListener("error", errorListener);
                }
                resolve([].slice.call(arguments));
              }
              eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
              if (name !== "error") {
                addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
              }
            });
          }
          function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
            if (typeof emitter.on === "function") {
              eventTargetAgnosticAddListener(emitter, "error", handler, flags);
            }
          }
          function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
            if (typeof emitter.on === "function") {
              if (flags.once) {
                emitter.once(name, listener);
              } else {
                emitter.on(name, listener);
              }
            } else if (typeof emitter.addEventListener === "function") {
              emitter.addEventListener(name, function wrapListener(arg) {
                if (flags.once) {
                  emitter.removeEventListener(name, wrapListener);
                }
                listener(arg);
              });
            } else {
              throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
            }
          }
        }
      ),
      /***/
      "../../node_modules/lodash/_Symbol.js": (
        /*!********************************************!*\
          !*** ../../node_modules/lodash/_Symbol.js ***!
          \********************************************/
        /***/
        (module, __unused_webpack_exports, __webpack_require__2) => {
          var root = __webpack_require__2(
            /*! ./_root */
            "../../node_modules/lodash/_root.js"
          );
          var Symbol2 = root.Symbol;
          module.exports = Symbol2;
        }
      ),
      /***/
      "../../node_modules/lodash/_baseGetTag.js": (
        /*!************************************************!*\
          !*** ../../node_modules/lodash/_baseGetTag.js ***!
          \************************************************/
        /***/
        (module, __unused_webpack_exports, __webpack_require__2) => {
          var Symbol2 = __webpack_require__2(
            /*! ./_Symbol */
            "../../node_modules/lodash/_Symbol.js"
          ), getRawTag = __webpack_require__2(
            /*! ./_getRawTag */
            "../../node_modules/lodash/_getRawTag.js"
          ), objectToString = __webpack_require__2(
            /*! ./_objectToString */
            "../../node_modules/lodash/_objectToString.js"
          );
          var nullTag = "[object Null]", undefinedTag = "[object Undefined]";
          var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
          function baseGetTag(value) {
            if (value == null) {
              return value === void 0 ? undefinedTag : nullTag;
            }
            return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
          }
          module.exports = baseGetTag;
        }
      ),
      /***/
      "../../node_modules/lodash/_baseTrim.js": (
        /*!**********************************************!*\
          !*** ../../node_modules/lodash/_baseTrim.js ***!
          \**********************************************/
        /***/
        (module, __unused_webpack_exports, __webpack_require__2) => {
          var trimmedEndIndex = __webpack_require__2(
            /*! ./_trimmedEndIndex */
            "../../node_modules/lodash/_trimmedEndIndex.js"
          );
          var reTrimStart = /^\s+/;
          function baseTrim(string2) {
            return string2 ? string2.slice(0, trimmedEndIndex(string2) + 1).replace(reTrimStart, "") : string2;
          }
          module.exports = baseTrim;
        }
      ),
      /***/
      "../../node_modules/lodash/_freeGlobal.js": (
        /*!************************************************!*\
          !*** ../../node_modules/lodash/_freeGlobal.js ***!
          \************************************************/
        /***/
        (module, __unused_webpack_exports, __webpack_require__2) => {
          var freeGlobal = typeof __webpack_require__2.g == "object" && __webpack_require__2.g && __webpack_require__2.g.Object === Object && __webpack_require__2.g;
          module.exports = freeGlobal;
        }
      ),
      /***/
      "../../node_modules/lodash/_getRawTag.js": (
        /*!***********************************************!*\
          !*** ../../node_modules/lodash/_getRawTag.js ***!
          \***********************************************/
        /***/
        (module, __unused_webpack_exports, __webpack_require__2) => {
          var Symbol2 = __webpack_require__2(
            /*! ./_Symbol */
            "../../node_modules/lodash/_Symbol.js"
          );
          var objectProto = Object.prototype;
          var hasOwnProperty2 = objectProto.hasOwnProperty;
          var nativeObjectToString = objectProto.toString;
          var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
          function getRawTag(value) {
            var isOwn = hasOwnProperty2.call(value, symToStringTag), tag = value[symToStringTag];
            try {
              value[symToStringTag] = void 0;
              var unmasked = true;
            } catch (e) {
            }
            var result = nativeObjectToString.call(value);
            if (unmasked) {
              if (isOwn) {
                value[symToStringTag] = tag;
              } else {
                delete value[symToStringTag];
              }
            }
            return result;
          }
          module.exports = getRawTag;
        }
      ),
      /***/
      "../../node_modules/lodash/_objectToString.js": (
        /*!****************************************************!*\
          !*** ../../node_modules/lodash/_objectToString.js ***!
          \****************************************************/
        /***/
        (module) => {
          var objectProto = Object.prototype;
          var nativeObjectToString = objectProto.toString;
          function objectToString(value) {
            return nativeObjectToString.call(value);
          }
          module.exports = objectToString;
        }
      ),
      /***/
      "../../node_modules/lodash/_root.js": (
        /*!******************************************!*\
          !*** ../../node_modules/lodash/_root.js ***!
          \******************************************/
        /***/
        (module, __unused_webpack_exports, __webpack_require__2) => {
          var freeGlobal = __webpack_require__2(
            /*! ./_freeGlobal */
            "../../node_modules/lodash/_freeGlobal.js"
          );
          var freeSelf = typeof self == "object" && self && self.Object === Object && self;
          var root = freeGlobal || freeSelf || Function("return this")();
          module.exports = root;
        }
      ),
      /***/
      "../../node_modules/lodash/_trimmedEndIndex.js": (
        /*!*****************************************************!*\
          !*** ../../node_modules/lodash/_trimmedEndIndex.js ***!
          \*****************************************************/
        /***/
        (module) => {
          var reWhitespace = /\s/;
          function trimmedEndIndex(string2) {
            var index2 = string2.length;
            while (index2-- && reWhitespace.test(string2.charAt(index2))) {
            }
            return index2;
          }
          module.exports = trimmedEndIndex;
        }
      ),
      /***/
      "../../node_modules/lodash/debounce.js": (
        /*!*********************************************!*\
          !*** ../../node_modules/lodash/debounce.js ***!
          \*********************************************/
        /***/
        (module, __unused_webpack_exports, __webpack_require__2) => {
          var isObject2 = __webpack_require__2(
            /*! ./isObject */
            "../../node_modules/lodash/isObject.js"
          ), now = __webpack_require__2(
            /*! ./now */
            "../../node_modules/lodash/now.js"
          ), toNumber = __webpack_require__2(
            /*! ./toNumber */
            "../../node_modules/lodash/toNumber.js"
          );
          var FUNC_ERROR_TEXT = "Expected a function";
          var nativeMax = Math.max, nativeMin = Math.min;
          function debounce2(func2, wait, options) {
            var lastArgs, lastThis, maxWait, result, timerId, lastCallTime, lastInvokeTime = 0, leading = false, maxing = false, trailing = true;
            if (typeof func2 != "function") {
              throw new TypeError(FUNC_ERROR_TEXT);
            }
            wait = toNumber(wait) || 0;
            if (isObject2(options)) {
              leading = !!options.leading;
              maxing = "maxWait" in options;
              maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
              trailing = "trailing" in options ? !!options.trailing : trailing;
            }
            function invokeFunc(time) {
              var args = lastArgs, thisArg = lastThis;
              lastArgs = lastThis = void 0;
              lastInvokeTime = time;
              result = func2.apply(thisArg, args);
              return result;
            }
            function leadingEdge(time) {
              lastInvokeTime = time;
              timerId = setTimeout(timerExpired, wait);
              return leading ? invokeFunc(time) : result;
            }
            function remainingWait(time) {
              var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime, timeWaiting = wait - timeSinceLastCall;
              return maxing ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
            }
            function shouldInvoke(time) {
              var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime;
              return lastCallTime === void 0 || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
            }
            function timerExpired() {
              var time = now();
              if (shouldInvoke(time)) {
                return trailingEdge(time);
              }
              timerId = setTimeout(timerExpired, remainingWait(time));
            }
            function trailingEdge(time) {
              timerId = void 0;
              if (trailing && lastArgs) {
                return invokeFunc(time);
              }
              lastArgs = lastThis = void 0;
              return result;
            }
            function cancel() {
              if (timerId !== void 0) {
                clearTimeout(timerId);
              }
              lastInvokeTime = 0;
              lastArgs = lastCallTime = lastThis = timerId = void 0;
            }
            function flush() {
              return timerId === void 0 ? result : trailingEdge(now());
            }
            function debounced() {
              var time = now(), isInvoking = shouldInvoke(time);
              lastArgs = arguments;
              lastThis = this;
              lastCallTime = time;
              if (isInvoking) {
                if (timerId === void 0) {
                  return leadingEdge(lastCallTime);
                }
                if (maxing) {
                  clearTimeout(timerId);
                  timerId = setTimeout(timerExpired, wait);
                  return invokeFunc(lastCallTime);
                }
              }
              if (timerId === void 0) {
                timerId = setTimeout(timerExpired, wait);
              }
              return result;
            }
            debounced.cancel = cancel;
            debounced.flush = flush;
            return debounced;
          }
          module.exports = debounce2;
        }
      ),
      /***/
      "../../node_modules/lodash/isObject.js": (
        /*!*********************************************!*\
          !*** ../../node_modules/lodash/isObject.js ***!
          \*********************************************/
        /***/
        (module) => {
          function isObject2(value) {
            var type = typeof value;
            return value != null && (type == "object" || type == "function");
          }
          module.exports = isObject2;
        }
      ),
      /***/
      "../../node_modules/lodash/isObjectLike.js": (
        /*!*************************************************!*\
          !*** ../../node_modules/lodash/isObjectLike.js ***!
          \*************************************************/
        /***/
        (module) => {
          function isObjectLike(value) {
            return value != null && typeof value == "object";
          }
          module.exports = isObjectLike;
        }
      ),
      /***/
      "../../node_modules/lodash/isSymbol.js": (
        /*!*********************************************!*\
          !*** ../../node_modules/lodash/isSymbol.js ***!
          \*********************************************/
        /***/
        (module, __unused_webpack_exports, __webpack_require__2) => {
          var baseGetTag = __webpack_require__2(
            /*! ./_baseGetTag */
            "../../node_modules/lodash/_baseGetTag.js"
          ), isObjectLike = __webpack_require__2(
            /*! ./isObjectLike */
            "../../node_modules/lodash/isObjectLike.js"
          );
          var symbolTag = "[object Symbol]";
          function isSymbol(value) {
            return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag;
          }
          module.exports = isSymbol;
        }
      ),
      /***/
      "../../node_modules/lodash/now.js": (
        /*!****************************************!*\
          !*** ../../node_modules/lodash/now.js ***!
          \****************************************/
        /***/
        (module, __unused_webpack_exports, __webpack_require__2) => {
          var root = __webpack_require__2(
            /*! ./_root */
            "../../node_modules/lodash/_root.js"
          );
          var now = function() {
            return root.Date.now();
          };
          module.exports = now;
        }
      ),
      /***/
      "../../node_modules/lodash/throttle.js": (
        /*!*********************************************!*\
          !*** ../../node_modules/lodash/throttle.js ***!
          \*********************************************/
        /***/
        (module, __unused_webpack_exports, __webpack_require__2) => {
          var debounce2 = __webpack_require__2(
            /*! ./debounce */
            "../../node_modules/lodash/debounce.js"
          ), isObject2 = __webpack_require__2(
            /*! ./isObject */
            "../../node_modules/lodash/isObject.js"
          );
          var FUNC_ERROR_TEXT = "Expected a function";
          function throttle2(func2, wait, options) {
            var leading = true, trailing = true;
            if (typeof func2 != "function") {
              throw new TypeError(FUNC_ERROR_TEXT);
            }
            if (isObject2(options)) {
              leading = "leading" in options ? !!options.leading : leading;
              trailing = "trailing" in options ? !!options.trailing : trailing;
            }
            return debounce2(func2, wait, {
              "leading": leading,
              "maxWait": wait,
              "trailing": trailing
            });
          }
          module.exports = throttle2;
        }
      ),
      /***/
      "../../node_modules/lodash/toNumber.js": (
        /*!*********************************************!*\
          !*** ../../node_modules/lodash/toNumber.js ***!
          \*********************************************/
        /***/
        (module, __unused_webpack_exports, __webpack_require__2) => {
          var baseTrim = __webpack_require__2(
            /*! ./_baseTrim */
            "../../node_modules/lodash/_baseTrim.js"
          ), isObject2 = __webpack_require__2(
            /*! ./isObject */
            "../../node_modules/lodash/isObject.js"
          ), isSymbol = __webpack_require__2(
            /*! ./isSymbol */
            "../../node_modules/lodash/isSymbol.js"
          );
          var NAN = 0 / 0;
          var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
          var reIsBinary = /^0b[01]+$/i;
          var reIsOctal = /^0o[0-7]+$/i;
          var freeParseInt = parseInt;
          function toNumber(value) {
            if (typeof value == "number") {
              return value;
            }
            if (isSymbol(value)) {
              return NAN;
            }
            if (isObject2(value)) {
              var other = typeof value.valueOf == "function" ? value.valueOf() : value;
              value = isObject2(other) ? other + "" : other;
            }
            if (typeof value != "string") {
              return value === 0 ? value : +value;
            }
            value = baseTrim(value);
            var isBinary = reIsBinary.test(value);
            return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
          }
          module.exports = toNumber;
        }
      ),
      /***/
      "../../node_modules/path-browserify/index.js": (
        /*!***************************************************!*\
          !*** ../../node_modules/path-browserify/index.js ***!
          \***************************************************/
        /***/
        (module) => {
          function assertPath(path) {
            if (typeof path !== "string") {
              throw new TypeError("Path must be a string. Received " + JSON.stringify(path));
            }
          }
          function normalizeStringPosix(path, allowAboveRoot) {
            var res = "";
            var lastSegmentLength = 0;
            var lastSlash = -1;
            var dots = 0;
            var code2;
            for (var i2 = 0; i2 <= path.length; ++i2) {
              if (i2 < path.length)
                code2 = path.charCodeAt(i2);
              else if (code2 === 47)
                break;
              else
                code2 = 47;
              if (code2 === 47) {
                if (lastSlash === i2 - 1 || dots === 1)
                  ;
                else if (lastSlash !== i2 - 1 && dots === 2) {
                  if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
                    if (res.length > 2) {
                      var lastSlashIndex = res.lastIndexOf("/");
                      if (lastSlashIndex !== res.length - 1) {
                        if (lastSlashIndex === -1) {
                          res = "";
                          lastSegmentLength = 0;
                        } else {
                          res = res.slice(0, lastSlashIndex);
                          lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
                        }
                        lastSlash = i2;
                        dots = 0;
                        continue;
                      }
                    } else if (res.length === 2 || res.length === 1) {
                      res = "";
                      lastSegmentLength = 0;
                      lastSlash = i2;
                      dots = 0;
                      continue;
                    }
                  }
                  if (allowAboveRoot) {
                    if (res.length > 0)
                      res += "/..";
                    else
                      res = "..";
                    lastSegmentLength = 2;
                  }
                } else {
                  if (res.length > 0)
                    res += "/" + path.slice(lastSlash + 1, i2);
                  else
                    res = path.slice(lastSlash + 1, i2);
                  lastSegmentLength = i2 - lastSlash - 1;
                }
                lastSlash = i2;
                dots = 0;
              } else if (code2 === 46 && dots !== -1) {
                ++dots;
              } else {
                dots = -1;
              }
            }
            return res;
          }
          function _format(sep, pathObject) {
            var dir = pathObject.dir || pathObject.root;
            var base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
            if (!dir) {
              return base;
            }
            if (dir === pathObject.root) {
              return dir + base;
            }
            return dir + sep + base;
          }
          var posix = {
            // path.resolve([from ...], to)
            resolve: function resolve() {
              var resolvedPath = "";
              var resolvedAbsolute = false;
              var cwd;
              for (var i2 = arguments.length - 1; i2 >= -1 && !resolvedAbsolute; i2--) {
                var path;
                if (i2 >= 0)
                  path = arguments[i2];
                else {
                  if (cwd === void 0)
                    cwd = process.cwd();
                  path = cwd;
                }
                assertPath(path);
                if (path.length === 0) {
                  continue;
                }
                resolvedPath = path + "/" + resolvedPath;
                resolvedAbsolute = path.charCodeAt(0) === 47;
              }
              resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);
              if (resolvedAbsolute) {
                if (resolvedPath.length > 0)
                  return "/" + resolvedPath;
                else
                  return "/";
              } else if (resolvedPath.length > 0) {
                return resolvedPath;
              } else {
                return ".";
              }
            },
            normalize: function normalize(path) {
              assertPath(path);
              if (path.length === 0)
                return ".";
              var isAbsolute = path.charCodeAt(0) === 47;
              var trailingSeparator = path.charCodeAt(path.length - 1) === 47;
              path = normalizeStringPosix(path, !isAbsolute);
              if (path.length === 0 && !isAbsolute)
                path = ".";
              if (path.length > 0 && trailingSeparator)
                path += "/";
              if (isAbsolute)
                return "/" + path;
              return path;
            },
            isAbsolute: function isAbsolute(path) {
              assertPath(path);
              return path.length > 0 && path.charCodeAt(0) === 47;
            },
            join: function join() {
              if (arguments.length === 0)
                return ".";
              var joined;
              for (var i2 = 0; i2 < arguments.length; ++i2) {
                var arg = arguments[i2];
                assertPath(arg);
                if (arg.length > 0) {
                  if (joined === void 0)
                    joined = arg;
                  else
                    joined += "/" + arg;
                }
              }
              if (joined === void 0)
                return ".";
              return posix.normalize(joined);
            },
            relative: function relative(from, to) {
              assertPath(from);
              assertPath(to);
              if (from === to)
                return "";
              from = posix.resolve(from);
              to = posix.resolve(to);
              if (from === to)
                return "";
              var fromStart = 1;
              for (; fromStart < from.length; ++fromStart) {
                if (from.charCodeAt(fromStart) !== 47)
                  break;
              }
              var fromEnd = from.length;
              var fromLen = fromEnd - fromStart;
              var toStart = 1;
              for (; toStart < to.length; ++toStart) {
                if (to.charCodeAt(toStart) !== 47)
                  break;
              }
              var toEnd = to.length;
              var toLen = toEnd - toStart;
              var length = fromLen < toLen ? fromLen : toLen;
              var lastCommonSep = -1;
              var i2 = 0;
              for (; i2 <= length; ++i2) {
                if (i2 === length) {
                  if (toLen > length) {
                    if (to.charCodeAt(toStart + i2) === 47) {
                      return to.slice(toStart + i2 + 1);
                    } else if (i2 === 0) {
                      return to.slice(toStart + i2);
                    }
                  } else if (fromLen > length) {
                    if (from.charCodeAt(fromStart + i2) === 47) {
                      lastCommonSep = i2;
                    } else if (i2 === 0) {
                      lastCommonSep = 0;
                    }
                  }
                  break;
                }
                var fromCode = from.charCodeAt(fromStart + i2);
                var toCode = to.charCodeAt(toStart + i2);
                if (fromCode !== toCode)
                  break;
                else if (fromCode === 47)
                  lastCommonSep = i2;
              }
              var out = "";
              for (i2 = fromStart + lastCommonSep + 1; i2 <= fromEnd; ++i2) {
                if (i2 === fromEnd || from.charCodeAt(i2) === 47) {
                  if (out.length === 0)
                    out += "..";
                  else
                    out += "/..";
                }
              }
              if (out.length > 0)
                return out + to.slice(toStart + lastCommonSep);
              else {
                toStart += lastCommonSep;
                if (to.charCodeAt(toStart) === 47)
                  ++toStart;
                return to.slice(toStart);
              }
            },
            _makeLong: function _makeLong(path) {
              return path;
            },
            dirname: function dirname(path) {
              assertPath(path);
              if (path.length === 0)
                return ".";
              var code2 = path.charCodeAt(0);
              var hasRoot = code2 === 47;
              var end = -1;
              var matchedSlash = true;
              for (var i2 = path.length - 1; i2 >= 1; --i2) {
                code2 = path.charCodeAt(i2);
                if (code2 === 47) {
                  if (!matchedSlash) {
                    end = i2;
                    break;
                  }
                } else {
                  matchedSlash = false;
                }
              }
              if (end === -1)
                return hasRoot ? "/" : ".";
              if (hasRoot && end === 1)
                return "//";
              return path.slice(0, end);
            },
            basename: function basename(path, ext) {
              if (ext !== void 0 && typeof ext !== "string")
                throw new TypeError('"ext" argument must be a string');
              assertPath(path);
              var start = 0;
              var end = -1;
              var matchedSlash = true;
              var i2;
              if (ext !== void 0 && ext.length > 0 && ext.length <= path.length) {
                if (ext.length === path.length && ext === path)
                  return "";
                var extIdx = ext.length - 1;
                var firstNonSlashEnd = -1;
                for (i2 = path.length - 1; i2 >= 0; --i2) {
                  var code2 = path.charCodeAt(i2);
                  if (code2 === 47) {
                    if (!matchedSlash) {
                      start = i2 + 1;
                      break;
                    }
                  } else {
                    if (firstNonSlashEnd === -1) {
                      matchedSlash = false;
                      firstNonSlashEnd = i2 + 1;
                    }
                    if (extIdx >= 0) {
                      if (code2 === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                          end = i2;
                        }
                      } else {
                        extIdx = -1;
                        end = firstNonSlashEnd;
                      }
                    }
                  }
                }
                if (start === end)
                  end = firstNonSlashEnd;
                else if (end === -1)
                  end = path.length;
                return path.slice(start, end);
              } else {
                for (i2 = path.length - 1; i2 >= 0; --i2) {
                  if (path.charCodeAt(i2) === 47) {
                    if (!matchedSlash) {
                      start = i2 + 1;
                      break;
                    }
                  } else if (end === -1) {
                    matchedSlash = false;
                    end = i2 + 1;
                  }
                }
                if (end === -1)
                  return "";
                return path.slice(start, end);
              }
            },
            extname: function extname(path) {
              assertPath(path);
              var startDot = -1;
              var startPart = 0;
              var end = -1;
              var matchedSlash = true;
              var preDotState = 0;
              for (var i2 = path.length - 1; i2 >= 0; --i2) {
                var code2 = path.charCodeAt(i2);
                if (code2 === 47) {
                  if (!matchedSlash) {
                    startPart = i2 + 1;
                    break;
                  }
                  continue;
                }
                if (end === -1) {
                  matchedSlash = false;
                  end = i2 + 1;
                }
                if (code2 === 46) {
                  if (startDot === -1)
                    startDot = i2;
                  else if (preDotState !== 1)
                    preDotState = 1;
                } else if (startDot !== -1) {
                  preDotState = -1;
                }
              }
              if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
              preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
              preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
                return "";
              }
              return path.slice(startDot, end);
            },
            format: function format(pathObject) {
              if (pathObject === null || typeof pathObject !== "object") {
                throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
              }
              return _format("/", pathObject);
            },
            parse: function parse2(path) {
              assertPath(path);
              var ret = { root: "", dir: "", base: "", ext: "", name: "" };
              if (path.length === 0)
                return ret;
              var code2 = path.charCodeAt(0);
              var isAbsolute = code2 === 47;
              var start;
              if (isAbsolute) {
                ret.root = "/";
                start = 1;
              } else {
                start = 0;
              }
              var startDot = -1;
              var startPart = 0;
              var end = -1;
              var matchedSlash = true;
              var i2 = path.length - 1;
              var preDotState = 0;
              for (; i2 >= start; --i2) {
                code2 = path.charCodeAt(i2);
                if (code2 === 47) {
                  if (!matchedSlash) {
                    startPart = i2 + 1;
                    break;
                  }
                  continue;
                }
                if (end === -1) {
                  matchedSlash = false;
                  end = i2 + 1;
                }
                if (code2 === 46) {
                  if (startDot === -1)
                    startDot = i2;
                  else if (preDotState !== 1)
                    preDotState = 1;
                } else if (startDot !== -1) {
                  preDotState = -1;
                }
              }
              if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
              preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
              preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
                if (end !== -1) {
                  if (startPart === 0 && isAbsolute)
                    ret.base = ret.name = path.slice(1, end);
                  else
                    ret.base = ret.name = path.slice(startPart, end);
                }
              } else {
                if (startPart === 0 && isAbsolute) {
                  ret.name = path.slice(1, startDot);
                  ret.base = path.slice(1, end);
                } else {
                  ret.name = path.slice(startPart, startDot);
                  ret.base = path.slice(startPart, end);
                }
                ret.ext = path.slice(startDot, end);
              }
              if (startPart > 0)
                ret.dir = path.slice(0, startPart - 1);
              else if (isAbsolute)
                ret.dir = "/";
              return ret;
            },
            sep: "/",
            delimiter: ":",
            win32: null,
            posix: null
          };
          posix.posix = posix;
          module.exports = posix;
        }
      ),
      /***/
      "../../node_modules/speakingurl/index.js": (
        /*!***********************************************!*\
          !*** ../../node_modules/speakingurl/index.js ***!
          \***********************************************/
        /***/
        (module, __unused_webpack_exports, __webpack_require__2) => {
          module.exports = __webpack_require__2(
            /*! ./lib/speakingurl */
            "../../node_modules/speakingurl/lib/speakingurl.js"
          );
        }
      ),
      /***/
      "../../node_modules/speakingurl/lib/speakingurl.js": (
        /*!*********************************************************!*\
          !*** ../../node_modules/speakingurl/lib/speakingurl.js ***!
          \*********************************************************/
        /***/
        function(module, exports) {
          var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;
          (function(root) {
            var charMap = {
              // latin
              "À": "A",
              "Á": "A",
              "Â": "A",
              "Ã": "A",
              "Ä": "Ae",
              "Å": "A",
              "Æ": "AE",
              "Ç": "C",
              "È": "E",
              "É": "E",
              "Ê": "E",
              "Ë": "E",
              "Ì": "I",
              "Í": "I",
              "Î": "I",
              "Ï": "I",
              "Ð": "D",
              "Ñ": "N",
              "Ò": "O",
              "Ó": "O",
              "Ô": "O",
              "Õ": "O",
              "Ö": "Oe",
              "Ő": "O",
              "Ø": "O",
              "Ù": "U",
              "Ú": "U",
              "Û": "U",
              "Ü": "Ue",
              "Ű": "U",
              "Ý": "Y",
              "Þ": "TH",
              "ß": "ss",
              "à": "a",
              "á": "a",
              "â": "a",
              "ã": "a",
              "ä": "ae",
              "å": "a",
              "æ": "ae",
              "ç": "c",
              "è": "e",
              "é": "e",
              "ê": "e",
              "ë": "e",
              "ì": "i",
              "í": "i",
              "î": "i",
              "ï": "i",
              "ð": "d",
              "ñ": "n",
              "ò": "o",
              "ó": "o",
              "ô": "o",
              "õ": "o",
              "ö": "oe",
              "ő": "o",
              "ø": "o",
              "ù": "u",
              "ú": "u",
              "û": "u",
              "ü": "ue",
              "ű": "u",
              "ý": "y",
              "þ": "th",
              "ÿ": "y",
              "ẞ": "SS",
              // language specific
              // Arabic
              "ا": "a",
              "أ": "a",
              "إ": "i",
              "آ": "aa",
              "ؤ": "u",
              "ئ": "e",
              "ء": "a",
              "ب": "b",
              "ت": "t",
              "ث": "th",
              "ج": "j",
              "ح": "h",
              "خ": "kh",
              "د": "d",
              "ذ": "th",
              "ر": "r",
              "ز": "z",
              "س": "s",
              "ش": "sh",
              "ص": "s",
              "ض": "dh",
              "ط": "t",
              "ظ": "z",
              "ع": "a",
              "غ": "gh",
              "ف": "f",
              "ق": "q",
              "ك": "k",
              "ل": "l",
              "م": "m",
              "ن": "n",
              "ه": "h",
              "و": "w",
              "ي": "y",
              "ى": "a",
              "ة": "h",
              "ﻻ": "la",
              "ﻷ": "laa",
              "ﻹ": "lai",
              "ﻵ": "laa",
              // Persian additional characters than Arabic
              "گ": "g",
              "چ": "ch",
              "پ": "p",
              "ژ": "zh",
              "ک": "k",
              "ی": "y",
              // Arabic diactrics
              "َ": "a",
              "ً": "an",
              "ِ": "e",
              "ٍ": "en",
              "ُ": "u",
              "ٌ": "on",
              "ْ": "",
              // Arabic numbers
              "٠": "0",
              "١": "1",
              "٢": "2",
              "٣": "3",
              "٤": "4",
              "٥": "5",
              "٦": "6",
              "٧": "7",
              "٨": "8",
              "٩": "9",
              // Persian numbers
              "۰": "0",
              "۱": "1",
              "۲": "2",
              "۳": "3",
              "۴": "4",
              "۵": "5",
              "۶": "6",
              "۷": "7",
              "۸": "8",
              "۹": "9",
              // Burmese consonants
              "က": "k",
              "ခ": "kh",
              "ဂ": "g",
              "ဃ": "ga",
              "င": "ng",
              "စ": "s",
              "ဆ": "sa",
              "ဇ": "z",
              "စျ": "za",
              "ည": "ny",
              "ဋ": "t",
              "ဌ": "ta",
              "ဍ": "d",
              "ဎ": "da",
              "ဏ": "na",
              "တ": "t",
              "ထ": "ta",
              "ဒ": "d",
              "ဓ": "da",
              "န": "n",
              "ပ": "p",
              "ဖ": "pa",
              "ဗ": "b",
              "ဘ": "ba",
              "မ": "m",
              "ယ": "y",
              "ရ": "ya",
              "လ": "l",
              "ဝ": "w",
              "သ": "th",
              "ဟ": "h",
              "ဠ": "la",
              "အ": "a",
              // consonant character combos
              "ြ": "y",
              "ျ": "ya",
              "ွ": "w",
              "ြွ": "yw",
              "ျွ": "ywa",
              "ှ": "h",
              // independent vowels
              "ဧ": "e",
              "၏": "-e",
              "ဣ": "i",
              "ဤ": "-i",
              "ဉ": "u",
              "ဦ": "-u",
              "ဩ": "aw",
              "သြော": "aw",
              "ဪ": "aw",
              // numbers
              "၀": "0",
              "၁": "1",
              "၂": "2",
              "၃": "3",
              "၄": "4",
              "၅": "5",
              "၆": "6",
              "၇": "7",
              "၈": "8",
              "၉": "9",
              // virama and tone marks which are silent in transliteration
              "္": "",
              "့": "",
              "း": "",
              // Czech
              "č": "c",
              "ď": "d",
              "ě": "e",
              "ň": "n",
              "ř": "r",
              "š": "s",
              "ť": "t",
              "ů": "u",
              "ž": "z",
              "Č": "C",
              "Ď": "D",
              "Ě": "E",
              "Ň": "N",
              "Ř": "R",
              "Š": "S",
              "Ť": "T",
              "Ů": "U",
              "Ž": "Z",
              // Dhivehi
              "ހ": "h",
              "ށ": "sh",
              "ނ": "n",
              "ރ": "r",
              "ބ": "b",
              "ޅ": "lh",
              "ކ": "k",
              "އ": "a",
              "ވ": "v",
              "މ": "m",
              "ފ": "f",
              "ދ": "dh",
              "ތ": "th",
              "ލ": "l",
              "ގ": "g",
              "ޏ": "gn",
              "ސ": "s",
              "ޑ": "d",
              "ޒ": "z",
              "ޓ": "t",
              "ޔ": "y",
              "ޕ": "p",
              "ޖ": "j",
              "ޗ": "ch",
              "ޘ": "tt",
              "ޙ": "hh",
              "ޚ": "kh",
              "ޛ": "th",
              "ޜ": "z",
              "ޝ": "sh",
              "ޞ": "s",
              "ޟ": "d",
              "ޠ": "t",
              "ޡ": "z",
              "ޢ": "a",
              "ޣ": "gh",
              "ޤ": "q",
              "ޥ": "w",
              "ަ": "a",
              "ާ": "aa",
              "ި": "i",
              "ީ": "ee",
              "ު": "u",
              "ޫ": "oo",
              "ެ": "e",
              "ޭ": "ey",
              "ޮ": "o",
              "ޯ": "oa",
              "ް": "",
              // Georgian https://en.wikipedia.org/wiki/Romanization_of_Georgian
              // National system (2002)
              "ა": "a",
              "ბ": "b",
              "გ": "g",
              "დ": "d",
              "ე": "e",
              "ვ": "v",
              "ზ": "z",
              "თ": "t",
              "ი": "i",
              "კ": "k",
              "ლ": "l",
              "მ": "m",
              "ნ": "n",
              "ო": "o",
              "პ": "p",
              "ჟ": "zh",
              "რ": "r",
              "ს": "s",
              "ტ": "t",
              "უ": "u",
              "ფ": "p",
              "ქ": "k",
              "ღ": "gh",
              "ყ": "q",
              "შ": "sh",
              "ჩ": "ch",
              "ც": "ts",
              "ძ": "dz",
              "წ": "ts",
              "ჭ": "ch",
              "ხ": "kh",
              "ჯ": "j",
              "ჰ": "h",
              // Greek
              "α": "a",
              "β": "v",
              "γ": "g",
              "δ": "d",
              "ε": "e",
              "ζ": "z",
              "η": "i",
              "θ": "th",
              "ι": "i",
              "κ": "k",
              "λ": "l",
              "μ": "m",
              "ν": "n",
              "ξ": "ks",
              "ο": "o",
              "π": "p",
              "ρ": "r",
              "σ": "s",
              "τ": "t",
              "υ": "y",
              "φ": "f",
              "χ": "x",
              "ψ": "ps",
              "ω": "o",
              "ά": "a",
              "έ": "e",
              "ί": "i",
              "ό": "o",
              "ύ": "y",
              "ή": "i",
              "ώ": "o",
              "ς": "s",
              "ϊ": "i",
              "ΰ": "y",
              "ϋ": "y",
              "ΐ": "i",
              "Α": "A",
              "Β": "B",
              "Γ": "G",
              "Δ": "D",
              "Ε": "E",
              "Ζ": "Z",
              "Η": "I",
              "Θ": "TH",
              "Ι": "I",
              "Κ": "K",
              "Λ": "L",
              "Μ": "M",
              "Ν": "N",
              "Ξ": "KS",
              "Ο": "O",
              "Π": "P",
              "Ρ": "R",
              "Σ": "S",
              "Τ": "T",
              "Υ": "Y",
              "Φ": "F",
              "Χ": "X",
              "Ψ": "PS",
              "Ω": "O",
              "Ά": "A",
              "Έ": "E",
              "Ί": "I",
              "Ό": "O",
              "Ύ": "Y",
              "Ή": "I",
              "Ώ": "O",
              "Ϊ": "I",
              "Ϋ": "Y",
              // Latvian
              "ā": "a",
              // 'č': 'c', // duplicate
              "ē": "e",
              "ģ": "g",
              "ī": "i",
              "ķ": "k",
              "ļ": "l",
              "ņ": "n",
              // 'š': 's', // duplicate
              "ū": "u",
              // 'ž': 'z', // duplicate
              "Ā": "A",
              // 'Č': 'C', // duplicate
              "Ē": "E",
              "Ģ": "G",
              "Ī": "I",
              "Ķ": "k",
              "Ļ": "L",
              "Ņ": "N",
              // 'Š': 'S', // duplicate
              "Ū": "U",
              // 'Ž': 'Z', // duplicate
              // Macedonian
              "Ќ": "Kj",
              "ќ": "kj",
              "Љ": "Lj",
              "љ": "lj",
              "Њ": "Nj",
              "њ": "nj",
              "Тс": "Ts",
              "тс": "ts",
              // Polish
              "ą": "a",
              "ć": "c",
              "ę": "e",
              "ł": "l",
              "ń": "n",
              // 'ó': 'o', // duplicate
              "ś": "s",
              "ź": "z",
              "ż": "z",
              "Ą": "A",
              "Ć": "C",
              "Ę": "E",
              "Ł": "L",
              "Ń": "N",
              "Ś": "S",
              "Ź": "Z",
              "Ż": "Z",
              // Ukranian
              "Є": "Ye",
              "І": "I",
              "Ї": "Yi",
              "Ґ": "G",
              "є": "ye",
              "і": "i",
              "ї": "yi",
              "ґ": "g",
              // Romanian
              "ă": "a",
              "Ă": "A",
              "ș": "s",
              "Ș": "S",
              // 'ş': 's', // duplicate
              // 'Ş': 'S', // duplicate
              "ț": "t",
              "Ț": "T",
              "ţ": "t",
              "Ţ": "T",
              // Russian https://en.wikipedia.org/wiki/Romanization_of_Russian
              // ICAO
              "а": "a",
              "б": "b",
              "в": "v",
              "г": "g",
              "д": "d",
              "е": "e",
              "ё": "yo",
              "ж": "zh",
              "з": "z",
              "и": "i",
              "й": "i",
              "к": "k",
              "л": "l",
              "м": "m",
              "н": "n",
              "о": "o",
              "п": "p",
              "р": "r",
              "с": "s",
              "т": "t",
              "у": "u",
              "ф": "f",
              "х": "kh",
              "ц": "c",
              "ч": "ch",
              "ш": "sh",
              "щ": "sh",
              "ъ": "",
              "ы": "y",
              "ь": "",
              "э": "e",
              "ю": "yu",
              "я": "ya",
              "А": "A",
              "Б": "B",
              "В": "V",
              "Г": "G",
              "Д": "D",
              "Е": "E",
              "Ё": "Yo",
              "Ж": "Zh",
              "З": "Z",
              "И": "I",
              "Й": "I",
              "К": "K",
              "Л": "L",
              "М": "M",
              "Н": "N",
              "О": "O",
              "П": "P",
              "Р": "R",
              "С": "S",
              "Т": "T",
              "У": "U",
              "Ф": "F",
              "Х": "Kh",
              "Ц": "C",
              "Ч": "Ch",
              "Ш": "Sh",
              "Щ": "Sh",
              "Ъ": "",
              "Ы": "Y",
              "Ь": "",
              "Э": "E",
              "Ю": "Yu",
              "Я": "Ya",
              // Serbian
              "ђ": "dj",
              "ј": "j",
              // 'љ': 'lj',  // duplicate
              // 'њ': 'nj', // duplicate
              "ћ": "c",
              "џ": "dz",
              "Ђ": "Dj",
              "Ј": "j",
              // 'Љ': 'Lj', // duplicate
              // 'Њ': 'Nj', // duplicate
              "Ћ": "C",
              "Џ": "Dz",
              // Slovak
              "ľ": "l",
              "ĺ": "l",
              "ŕ": "r",
              "Ľ": "L",
              "Ĺ": "L",
              "Ŕ": "R",
              // Turkish
              "ş": "s",
              "Ş": "S",
              "ı": "i",
              "İ": "I",
              // 'ç': 'c', // duplicate
              // 'Ç': 'C', // duplicate
              // 'ü': 'u', // duplicate, see langCharMap
              // 'Ü': 'U', // duplicate, see langCharMap
              // 'ö': 'o', // duplicate, see langCharMap
              // 'Ö': 'O', // duplicate, see langCharMap
              "ğ": "g",
              "Ğ": "G",
              // Vietnamese
              "ả": "a",
              "Ả": "A",
              "ẳ": "a",
              "Ẳ": "A",
              "ẩ": "a",
              "Ẩ": "A",
              "đ": "d",
              "Đ": "D",
              "ẹ": "e",
              "Ẹ": "E",
              "ẽ": "e",
              "Ẽ": "E",
              "ẻ": "e",
              "Ẻ": "E",
              "ế": "e",
              "Ế": "E",
              "ề": "e",
              "Ề": "E",
              "ệ": "e",
              "Ệ": "E",
              "ễ": "e",
              "Ễ": "E",
              "ể": "e",
              "Ể": "E",
              "ỏ": "o",
              "ọ": "o",
              "Ọ": "o",
              "ố": "o",
              "Ố": "O",
              "ồ": "o",
              "Ồ": "O",
              "ổ": "o",
              "Ổ": "O",
              "ộ": "o",
              "Ộ": "O",
              "ỗ": "o",
              "Ỗ": "O",
              "ơ": "o",
              "Ơ": "O",
              "ớ": "o",
              "Ớ": "O",
              "ờ": "o",
              "Ờ": "O",
              "ợ": "o",
              "Ợ": "O",
              "ỡ": "o",
              "Ỡ": "O",
              "Ở": "o",
              "ở": "o",
              "ị": "i",
              "Ị": "I",
              "ĩ": "i",
              "Ĩ": "I",
              "ỉ": "i",
              "Ỉ": "i",
              "ủ": "u",
              "Ủ": "U",
              "ụ": "u",
              "Ụ": "U",
              "ũ": "u",
              "Ũ": "U",
              "ư": "u",
              "Ư": "U",
              "ứ": "u",
              "Ứ": "U",
              "ừ": "u",
              "Ừ": "U",
              "ự": "u",
              "Ự": "U",
              "ữ": "u",
              "Ữ": "U",
              "ử": "u",
              "Ử": "ư",
              "ỷ": "y",
              "Ỷ": "y",
              "ỳ": "y",
              "Ỳ": "Y",
              "ỵ": "y",
              "Ỵ": "Y",
              "ỹ": "y",
              "Ỹ": "Y",
              "ạ": "a",
              "Ạ": "A",
              "ấ": "a",
              "Ấ": "A",
              "ầ": "a",
              "Ầ": "A",
              "ậ": "a",
              "Ậ": "A",
              "ẫ": "a",
              "Ẫ": "A",
              // 'ă': 'a', // duplicate
              // 'Ă': 'A', // duplicate
              "ắ": "a",
              "Ắ": "A",
              "ằ": "a",
              "Ằ": "A",
              "ặ": "a",
              "Ặ": "A",
              "ẵ": "a",
              "Ẵ": "A",
              "⓪": "0",
              "①": "1",
              "②": "2",
              "③": "3",
              "④": "4",
              "⑤": "5",
              "⑥": "6",
              "⑦": "7",
              "⑧": "8",
              "⑨": "9",
              "⑩": "10",
              "⑪": "11",
              "⑫": "12",
              "⑬": "13",
              "⑭": "14",
              "⑮": "15",
              "⑯": "16",
              "⑰": "17",
              "⑱": "18",
              "⑲": "18",
              "⑳": "18",
              "⓵": "1",
              "⓶": "2",
              "⓷": "3",
              "⓸": "4",
              "⓹": "5",
              "⓺": "6",
              "⓻": "7",
              "⓼": "8",
              "⓽": "9",
              "⓾": "10",
              "⓿": "0",
              "⓫": "11",
              "⓬": "12",
              "⓭": "13",
              "⓮": "14",
              "⓯": "15",
              "⓰": "16",
              "⓱": "17",
              "⓲": "18",
              "⓳": "19",
              "⓴": "20",
              "Ⓐ": "A",
              "Ⓑ": "B",
              "Ⓒ": "C",
              "Ⓓ": "D",
              "Ⓔ": "E",
              "Ⓕ": "F",
              "Ⓖ": "G",
              "Ⓗ": "H",
              "Ⓘ": "I",
              "Ⓙ": "J",
              "Ⓚ": "K",
              "Ⓛ": "L",
              "Ⓜ": "M",
              "Ⓝ": "N",
              "Ⓞ": "O",
              "Ⓟ": "P",
              "Ⓠ": "Q",
              "Ⓡ": "R",
              "Ⓢ": "S",
              "Ⓣ": "T",
              "Ⓤ": "U",
              "Ⓥ": "V",
              "Ⓦ": "W",
              "Ⓧ": "X",
              "Ⓨ": "Y",
              "Ⓩ": "Z",
              "ⓐ": "a",
              "ⓑ": "b",
              "ⓒ": "c",
              "ⓓ": "d",
              "ⓔ": "e",
              "ⓕ": "f",
              "ⓖ": "g",
              "ⓗ": "h",
              "ⓘ": "i",
              "ⓙ": "j",
              "ⓚ": "k",
              "ⓛ": "l",
              "ⓜ": "m",
              "ⓝ": "n",
              "ⓞ": "o",
              "ⓟ": "p",
              "ⓠ": "q",
              "ⓡ": "r",
              "ⓢ": "s",
              "ⓣ": "t",
              "ⓤ": "u",
              "ⓦ": "v",
              "ⓥ": "w",
              "ⓧ": "x",
              "ⓨ": "y",
              "ⓩ": "z",
              // symbols
              "“": '"',
              "”": '"',
              "‘": "'",
              "’": "'",
              "∂": "d",
              "ƒ": "f",
              "™": "(TM)",
              "©": "(C)",
              "œ": "oe",
              "Œ": "OE",
              "®": "(R)",
              "†": "+",
              "℠": "(SM)",
              "…": "...",
              "˚": "o",
              "º": "o",
              "ª": "a",
              "•": "*",
              "၊": ",",
              "။": ".",
              // currency
              "$": "USD",
              "€": "EUR",
              "₢": "BRN",
              "₣": "FRF",
              "£": "GBP",
              "₤": "ITL",
              "₦": "NGN",
              "₧": "ESP",
              "₩": "KRW",
              "₪": "ILS",
              "₫": "VND",
              "₭": "LAK",
              "₮": "MNT",
              "₯": "GRD",
              "₱": "ARS",
              "₲": "PYG",
              "₳": "ARA",
              "₴": "UAH",
              "₵": "GHS",
              "¢": "cent",
              "¥": "CNY",
              "元": "CNY",
              "円": "YEN",
              "﷼": "IRR",
              "₠": "EWE",
              "฿": "THB",
              "₨": "INR",
              "₹": "INR",
              "₰": "PF",
              "₺": "TRY",
              "؋": "AFN",
              "₼": "AZN",
              "лв": "BGN",
              "៛": "KHR",
              "₡": "CRC",
              "₸": "KZT",
              "ден": "MKD",
              "zł": "PLN",
              "₽": "RUB",
              "₾": "GEL"
            };
            var lookAheadCharArray = [
              // burmese
              "်",
              // Dhivehi
              "ް"
            ];
            var diatricMap = {
              // Burmese
              // dependent vowels
              "ာ": "a",
              "ါ": "a",
              "ေ": "e",
              "ဲ": "e",
              "ိ": "i",
              "ီ": "i",
              "ို": "o",
              "ု": "u",
              "ူ": "u",
              "ေါင်": "aung",
              "ော": "aw",
              "ော်": "aw",
              "ေါ": "aw",
              "ေါ်": "aw",
              "်": "်",
              // this is special case but the character will be converted to latin in the code
              "က်": "et",
              "ိုက်": "aik",
              "ောက်": "auk",
              "င်": "in",
              "ိုင်": "aing",
              "ောင်": "aung",
              "စ်": "it",
              "ည်": "i",
              "တ်": "at",
              "ိတ်": "eik",
              "ုတ်": "ok",
              "ွတ်": "ut",
              "ေတ်": "it",
              "ဒ်": "d",
              "ိုဒ်": "ok",
              "ုဒ်": "ait",
              "န်": "an",
              "ာန်": "an",
              "ိန်": "ein",
              "ုန်": "on",
              "ွန်": "un",
              "ပ်": "at",
              "ိပ်": "eik",
              "ုပ်": "ok",
              "ွပ်": "ut",
              "န်ုပ်": "nub",
              "မ်": "an",
              "ိမ်": "ein",
              "ုမ်": "on",
              "ွမ်": "un",
              "ယ်": "e",
              "ိုလ်": "ol",
              "ဉ်": "in",
              "ံ": "an",
              "ိံ": "ein",
              "ုံ": "on",
              // Dhivehi
              "ައް": "ah",
              "ަށް": "ah"
            };
            var langCharMap = {
              "en": {},
              // default language
              "az": {
                // Azerbaijani
                "ç": "c",
                "ə": "e",
                "ğ": "g",
                "ı": "i",
                "ö": "o",
                "ş": "s",
                "ü": "u",
                "Ç": "C",
                "Ə": "E",
                "Ğ": "G",
                "İ": "I",
                "Ö": "O",
                "Ş": "S",
                "Ü": "U"
              },
              "cs": {
                // Czech
                "č": "c",
                "ď": "d",
                "ě": "e",
                "ň": "n",
                "ř": "r",
                "š": "s",
                "ť": "t",
                "ů": "u",
                "ž": "z",
                "Č": "C",
                "Ď": "D",
                "Ě": "E",
                "Ň": "N",
                "Ř": "R",
                "Š": "S",
                "Ť": "T",
                "Ů": "U",
                "Ž": "Z"
              },
              "fi": {
                // Finnish
                // 'å': 'a', duplicate see charMap/latin
                // 'Å': 'A', duplicate see charMap/latin
                "ä": "a",
                // ok
                "Ä": "A",
                // ok
                "ö": "o",
                // ok
                "Ö": "O"
                // ok
              },
              "hu": {
                // Hungarian
                "ä": "a",
                // ok
                "Ä": "A",
                // ok
                // 'á': 'a', duplicate see charMap/latin
                // 'Á': 'A', duplicate see charMap/latin
                "ö": "o",
                // ok
                "Ö": "O",
                // ok
                // 'ő': 'o', duplicate see charMap/latin
                // 'Ő': 'O', duplicate see charMap/latin
                "ü": "u",
                "Ü": "U",
                "ű": "u",
                "Ű": "U"
              },
              "lt": {
                // Lithuanian
                "ą": "a",
                "č": "c",
                "ę": "e",
                "ė": "e",
                "į": "i",
                "š": "s",
                "ų": "u",
                "ū": "u",
                "ž": "z",
                "Ą": "A",
                "Č": "C",
                "Ę": "E",
                "Ė": "E",
                "Į": "I",
                "Š": "S",
                "Ų": "U",
                "Ū": "U"
              },
              "lv": {
                // Latvian
                "ā": "a",
                "č": "c",
                "ē": "e",
                "ģ": "g",
                "ī": "i",
                "ķ": "k",
                "ļ": "l",
                "ņ": "n",
                "š": "s",
                "ū": "u",
                "ž": "z",
                "Ā": "A",
                "Č": "C",
                "Ē": "E",
                "Ģ": "G",
                "Ī": "i",
                "Ķ": "k",
                "Ļ": "L",
                "Ņ": "N",
                "Š": "S",
                "Ū": "u",
                "Ž": "Z"
              },
              "pl": {
                // Polish
                "ą": "a",
                "ć": "c",
                "ę": "e",
                "ł": "l",
                "ń": "n",
                "ó": "o",
                "ś": "s",
                "ź": "z",
                "ż": "z",
                "Ą": "A",
                "Ć": "C",
                "Ę": "e",
                "Ł": "L",
                "Ń": "N",
                "Ó": "O",
                "Ś": "S",
                "Ź": "Z",
                "Ż": "Z"
              },
              "sv": {
                // Swedish
                // 'å': 'a', duplicate see charMap/latin
                // 'Å': 'A', duplicate see charMap/latin
                "ä": "a",
                // ok
                "Ä": "A",
                // ok
                "ö": "o",
                // ok
                "Ö": "O"
                // ok
              },
              "sk": {
                // Slovak
                "ä": "a",
                "Ä": "A"
              },
              "sr": {
                // Serbian
                "љ": "lj",
                "њ": "nj",
                "Љ": "Lj",
                "Њ": "Nj",
                "đ": "dj",
                "Đ": "Dj"
              },
              "tr": {
                // Turkish
                "Ü": "U",
                "Ö": "O",
                "ü": "u",
                "ö": "o"
              }
            };
            var symbolMap = {
              "ar": {
                "∆": "delta",
                "∞": "la-nihaya",
                "♥": "hob",
                "&": "wa",
                "|": "aw",
                "<": "aqal-men",
                ">": "akbar-men",
                "∑": "majmou",
                "¤": "omla"
              },
              "az": {},
              "ca": {
                "∆": "delta",
                "∞": "infinit",
                "♥": "amor",
                "&": "i",
                "|": "o",
                "<": "menys que",
                ">": "mes que",
                "∑": "suma dels",
                "¤": "moneda"
              },
              "cs": {
                "∆": "delta",
                "∞": "nekonecno",
                "♥": "laska",
                "&": "a",
                "|": "nebo",
                "<": "mensi nez",
                ">": "vetsi nez",
                "∑": "soucet",
                "¤": "mena"
              },
              "de": {
                "∆": "delta",
                "∞": "unendlich",
                "♥": "Liebe",
                "&": "und",
                "|": "oder",
                "<": "kleiner als",
                ">": "groesser als",
                "∑": "Summe von",
                "¤": "Waehrung"
              },
              "dv": {
                "∆": "delta",
                "∞": "kolunulaa",
                "♥": "loabi",
                "&": "aai",
                "|": "noonee",
                "<": "ah vure kuda",
                ">": "ah vure bodu",
                "∑": "jumula",
                "¤": "faisaa"
              },
              "en": {
                "∆": "delta",
                "∞": "infinity",
                "♥": "love",
                "&": "and",
                "|": "or",
                "<": "less than",
                ">": "greater than",
                "∑": "sum",
                "¤": "currency"
              },
              "es": {
                "∆": "delta",
                "∞": "infinito",
                "♥": "amor",
                "&": "y",
                "|": "u",
                "<": "menos que",
                ">": "mas que",
                "∑": "suma de los",
                "¤": "moneda"
              },
              "fa": {
                "∆": "delta",
                "∞": "bi-nahayat",
                "♥": "eshgh",
                "&": "va",
                "|": "ya",
                "<": "kamtar-az",
                ">": "bishtar-az",
                "∑": "majmooe",
                "¤": "vahed"
              },
              "fi": {
                "∆": "delta",
                "∞": "aarettomyys",
                "♥": "rakkaus",
                "&": "ja",
                "|": "tai",
                "<": "pienempi kuin",
                ">": "suurempi kuin",
                "∑": "summa",
                "¤": "valuutta"
              },
              "fr": {
                "∆": "delta",
                "∞": "infiniment",
                "♥": "Amour",
                "&": "et",
                "|": "ou",
                "<": "moins que",
                ">": "superieure a",
                "∑": "somme des",
                "¤": "monnaie"
              },
              "ge": {
                "∆": "delta",
                "∞": "usasruloba",
                "♥": "siqvaruli",
                "&": "da",
                "|": "an",
                "<": "naklebi",
                ">": "meti",
                "∑": "jami",
                "¤": "valuta"
              },
              "gr": {},
              "hu": {
                "∆": "delta",
                "∞": "vegtelen",
                "♥": "szerelem",
                "&": "es",
                "|": "vagy",
                "<": "kisebb mint",
                ">": "nagyobb mint",
                "∑": "szumma",
                "¤": "penznem"
              },
              "it": {
                "∆": "delta",
                "∞": "infinito",
                "♥": "amore",
                "&": "e",
                "|": "o",
                "<": "minore di",
                ">": "maggiore di",
                "∑": "somma",
                "¤": "moneta"
              },
              "lt": {
                "∆": "delta",
                "∞": "begalybe",
                "♥": "meile",
                "&": "ir",
                "|": "ar",
                "<": "maziau nei",
                ">": "daugiau nei",
                "∑": "suma",
                "¤": "valiuta"
              },
              "lv": {
                "∆": "delta",
                "∞": "bezgaliba",
                "♥": "milestiba",
                "&": "un",
                "|": "vai",
                "<": "mazak neka",
                ">": "lielaks neka",
                "∑": "summa",
                "¤": "valuta"
              },
              "my": {
                "∆": "kwahkhyaet",
                "∞": "asaonasme",
                "♥": "akhyait",
                "&": "nhin",
                "|": "tho",
                "<": "ngethaw",
                ">": "kyithaw",
                "∑": "paungld",
                "¤": "ngwekye"
              },
              "mk": {},
              "nl": {
                "∆": "delta",
                "∞": "oneindig",
                "♥": "liefde",
                "&": "en",
                "|": "of",
                "<": "kleiner dan",
                ">": "groter dan",
                "∑": "som",
                "¤": "valuta"
              },
              "pl": {
                "∆": "delta",
                "∞": "nieskonczonosc",
                "♥": "milosc",
                "&": "i",
                "|": "lub",
                "<": "mniejsze niz",
                ">": "wieksze niz",
                "∑": "suma",
                "¤": "waluta"
              },
              "pt": {
                "∆": "delta",
                "∞": "infinito",
                "♥": "amor",
                "&": "e",
                "|": "ou",
                "<": "menor que",
                ">": "maior que",
                "∑": "soma",
                "¤": "moeda"
              },
              "ro": {
                "∆": "delta",
                "∞": "infinit",
                "♥": "dragoste",
                "&": "si",
                "|": "sau",
                "<": "mai mic ca",
                ">": "mai mare ca",
                "∑": "suma",
                "¤": "valuta"
              },
              "ru": {
                "∆": "delta",
                "∞": "beskonechno",
                "♥": "lubov",
                "&": "i",
                "|": "ili",
                "<": "menshe",
                ">": "bolshe",
                "∑": "summa",
                "¤": "valjuta"
              },
              "sk": {
                "∆": "delta",
                "∞": "nekonecno",
                "♥": "laska",
                "&": "a",
                "|": "alebo",
                "<": "menej ako",
                ">": "viac ako",
                "∑": "sucet",
                "¤": "mena"
              },
              "sr": {},
              "tr": {
                "∆": "delta",
                "∞": "sonsuzluk",
                "♥": "ask",
                "&": "ve",
                "|": "veya",
                "<": "kucuktur",
                ">": "buyuktur",
                "∑": "toplam",
                "¤": "para birimi"
              },
              "uk": {
                "∆": "delta",
                "∞": "bezkinechnist",
                "♥": "lubov",
                "&": "i",
                "|": "abo",
                "<": "menshe",
                ">": "bilshe",
                "∑": "suma",
                "¤": "valjuta"
              },
              "vn": {
                "∆": "delta",
                "∞": "vo cuc",
                "♥": "yeu",
                "&": "va",
                "|": "hoac",
                "<": "nho hon",
                ">": "lon hon",
                "∑": "tong",
                "¤": "tien te"
              }
            };
            var uricChars = [";", "?", ":", "@", "&", "=", "+", "$", ",", "/"].join("");
            var uricNoSlashChars = [";", "?", ":", "@", "&", "=", "+", "$", ","].join("");
            var markChars = [".", "!", "~", "*", "'", "(", ")"].join("");
            var getSlug = function getSlug2(input, opts) {
              var separator = "-";
              var result = "";
              var diatricString = "";
              var convertSymbols = true;
              var customReplacements = {};
              var maintainCase;
              var titleCase;
              var truncate;
              var uricFlag;
              var uricNoSlashFlag;
              var markFlag;
              var symbol;
              var langChar;
              var lucky;
              var i2;
              var ch;
              var l2;
              var lastCharWasSymbol;
              var lastCharWasDiatric;
              var allowedChars = "";
              if (typeof input !== "string") {
                return "";
              }
              if (typeof opts === "string") {
                separator = opts;
              }
              symbol = symbolMap.en;
              langChar = langCharMap.en;
              if (typeof opts === "object") {
                maintainCase = opts.maintainCase || false;
                customReplacements = opts.custom && typeof opts.custom === "object" ? opts.custom : customReplacements;
                truncate = +opts.truncate > 1 && opts.truncate || false;
                uricFlag = opts.uric || false;
                uricNoSlashFlag = opts.uricNoSlash || false;
                markFlag = opts.mark || false;
                convertSymbols = opts.symbols === false || opts.lang === false ? false : true;
                separator = opts.separator || separator;
                if (uricFlag) {
                  allowedChars += uricChars;
                }
                if (uricNoSlashFlag) {
                  allowedChars += uricNoSlashChars;
                }
                if (markFlag) {
                  allowedChars += markChars;
                }
                symbol = opts.lang && symbolMap[opts.lang] && convertSymbols ? symbolMap[opts.lang] : convertSymbols ? symbolMap.en : {};
                langChar = opts.lang && langCharMap[opts.lang] ? langCharMap[opts.lang] : opts.lang === false || opts.lang === true ? {} : langCharMap.en;
                if (opts.titleCase && typeof opts.titleCase.length === "number" && Array.prototype.toString.call(opts.titleCase)) {
                  opts.titleCase.forEach(function(v2) {
                    customReplacements[v2 + ""] = v2 + "";
                  });
                  titleCase = true;
                } else {
                  titleCase = !!opts.titleCase;
                }
                if (opts.custom && typeof opts.custom.length === "number" && Array.prototype.toString.call(opts.custom)) {
                  opts.custom.forEach(function(v2) {
                    customReplacements[v2 + ""] = v2 + "";
                  });
                }
                Object.keys(customReplacements).forEach(function(v2) {
                  var r2;
                  if (v2.length > 1) {
                    r2 = new RegExp("\\b" + escapeChars(v2) + "\\b", "gi");
                  } else {
                    r2 = new RegExp(escapeChars(v2), "gi");
                  }
                  input = input.replace(r2, customReplacements[v2]);
                });
                for (ch in customReplacements) {
                  allowedChars += ch;
                }
              }
              allowedChars += separator;
              allowedChars = escapeChars(allowedChars);
              input = input.replace(/(^\s+|\s+$)/g, "");
              lastCharWasSymbol = false;
              lastCharWasDiatric = false;
              for (i2 = 0, l2 = input.length; i2 < l2; i2++) {
                ch = input[i2];
                if (isReplacedCustomChar(ch, customReplacements)) {
                  lastCharWasSymbol = false;
                } else if (langChar[ch]) {
                  ch = lastCharWasSymbol && langChar[ch].match(/[A-Za-z0-9]/) ? " " + langChar[ch] : langChar[ch];
                  lastCharWasSymbol = false;
                } else if (ch in charMap) {
                  if (i2 + 1 < l2 && lookAheadCharArray.indexOf(input[i2 + 1]) >= 0) {
                    diatricString += ch;
                    ch = "";
                  } else if (lastCharWasDiatric === true) {
                    ch = diatricMap[diatricString] + charMap[ch];
                    diatricString = "";
                  } else {
                    ch = lastCharWasSymbol && charMap[ch].match(/[A-Za-z0-9]/) ? " " + charMap[ch] : charMap[ch];
                  }
                  lastCharWasSymbol = false;
                  lastCharWasDiatric = false;
                } else if (ch in diatricMap) {
                  diatricString += ch;
                  ch = "";
                  if (i2 === l2 - 1) {
                    ch = diatricMap[diatricString];
                  }
                  lastCharWasDiatric = true;
                } else if (
                  // process symbol chars
                  symbol[ch] && !(uricFlag && uricChars.indexOf(ch) !== -1) && !(uricNoSlashFlag && uricNoSlashChars.indexOf(ch) !== -1)
                ) {
                  ch = lastCharWasSymbol || result.substr(-1).match(/[A-Za-z0-9]/) ? separator + symbol[ch] : symbol[ch];
                  ch += input[i2 + 1] !== void 0 && input[i2 + 1].match(/[A-Za-z0-9]/) ? separator : "";
                  lastCharWasSymbol = true;
                } else {
                  if (lastCharWasDiatric === true) {
                    ch = diatricMap[diatricString] + ch;
                    diatricString = "";
                    lastCharWasDiatric = false;
                  } else if (lastCharWasSymbol && (/[A-Za-z0-9]/.test(ch) || result.substr(-1).match(/A-Za-z0-9]/))) {
                    ch = " " + ch;
                  }
                  lastCharWasSymbol = false;
                }
                result += ch.replace(new RegExp("[^\\w\\s" + allowedChars + "_-]", "g"), separator);
              }
              if (titleCase) {
                result = result.replace(/(\w)(\S*)/g, function(_2, i3, r2) {
                  var j2 = i3.toUpperCase() + (r2 !== null ? r2 : "");
                  return Object.keys(customReplacements).indexOf(j2.toLowerCase()) < 0 ? j2 : j2.toLowerCase();
                });
              }
              result = result.replace(/\s+/g, separator).replace(new RegExp("\\" + separator + "+", "g"), separator).replace(new RegExp("(^\\" + separator + "+|\\" + separator + "+$)", "g"), "");
              if (truncate && result.length > truncate) {
                lucky = result.charAt(truncate) === separator;
                result = result.slice(0, truncate);
                if (!lucky) {
                  result = result.slice(0, result.lastIndexOf(separator));
                }
              }
              if (!maintainCase && !titleCase) {
                result = result.toLowerCase();
              }
              return result;
            };
            var createSlug = function createSlug2(opts) {
              return function getSlugWithConfig(input) {
                return getSlug(input, opts);
              };
            };
            var escapeChars = function escapeChars2(input) {
              return input.replace(/[-\\^$*+?.()|[\]{}\/]/g, "\\$&");
            };
            var isReplacedCustomChar = function(ch, customReplacements) {
              for (var c2 in customReplacements) {
                if (customReplacements[c2] === ch) {
                  return true;
                }
              }
            };
            if (module.exports) {
              module.exports = getSlug;
              module.exports.createSlug = createSlug;
            } else {
              !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {
                return getSlug;
              }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== void 0 && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
            }
          })();
        }
      )
      /******/
    };
    var __webpack_module_cache__ = {};
    function __webpack_require__(moduleId) {
      var cachedModule = __webpack_module_cache__[moduleId];
      if (cachedModule !== void 0) {
        return cachedModule.exports;
      }
      var module = __webpack_module_cache__[moduleId] = {
        /******/
        // no module.id needed
        /******/
        // no module.loaded needed
        /******/
        exports: {}
        /******/
      };
      __webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
      return module.exports;
    }
    (() => {
      __webpack_require__.n = (module) => {
        var getter = module && module.__esModule ? (
          /******/
          () => module["default"]
        ) : (
          /******/
          () => module
        );
        __webpack_require__.d(getter, { a: getter });
        return getter;
      };
    })();
    (() => {
      __webpack_require__.d = (exports, definition) => {
        for (var key in definition) {
          if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
            Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
          }
        }
      };
    })();
    (() => {
      __webpack_require__.g = function() {
        if (typeof globalThis === "object")
          return globalThis;
        try {
          return this || new Function("return this")();
        } catch (e) {
          if (typeof window === "object")
            return window;
        }
      }();
    })();
    (() => {
      __webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
    })();
    (() => {
      __webpack_require__.r = (exports) => {
        if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
          Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
        }
        Object.defineProperty(exports, "__esModule", { value: true });
      };
    })();
    var __webpack_exports__ = {};
    (() => {
      /*!************************!*\
        !*** ./src/backend.ts ***!
        \************************/
      __webpack_require__.r(__webpack_exports__);
      var _back_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
        /*! @back/index */
        "../app-backend-core/lib/index.js"
      );
      var _vue_devtools_shared_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
        /*! @vue-devtools/shared-utils */
        "../shared-utils/lib/index.js"
      );
      _vue_devtools_shared_utils__WEBPACK_IMPORTED_MODULE_1__.target.__VUE_DEVTOOLS_ON_SOCKET_READY__(() => {
        const socket = _vue_devtools_shared_utils__WEBPACK_IMPORTED_MODULE_1__.target.__VUE_DEVTOOLS_SOCKET__;
        const connectedMessage = () => {
          if (_vue_devtools_shared_utils__WEBPACK_IMPORTED_MODULE_1__.target.__VUE_DEVTOOLS_TOAST__) {
            _vue_devtools_shared_utils__WEBPACK_IMPORTED_MODULE_1__.target.__VUE_DEVTOOLS_TOAST__("Remote Devtools Connected", "normal");
          }
        };
        const disconnectedMessage = () => {
          if (_vue_devtools_shared_utils__WEBPACK_IMPORTED_MODULE_1__.target.__VUE_DEVTOOLS_TOAST__) {
            _vue_devtools_shared_utils__WEBPACK_IMPORTED_MODULE_1__.target.__VUE_DEVTOOLS_TOAST__("Remote Devtools Disconnected", "error");
          }
        };
        socket.on("connect", () => {
          connectedMessage();
          (0, _back_index__WEBPACK_IMPORTED_MODULE_0__.initBackend)(bridge);
          socket.emit("vue-devtools-init");
        });
        socket.on("disconnect", () => {
          socket.disconnect();
          disconnectedMessage();
        });
        socket.on("vue-devtools-disconnect-backend", () => {
          socket.disconnect();
        });
        const bridge = new _vue_devtools_shared_utils__WEBPACK_IMPORTED_MODULE_1__.Bridge({
          listen(fn) {
            socket.on("vue-message", (data) => fn(data));
          },
          send(data) {
            socket.emit("vue-message", data);
          }
        });
        bridge.on("shutdown", () => {
          socket.disconnect();
          disconnectedMessage();
        });
      });
    })();
  })();
  const ON_SHOW = "onShow";
  const ON_LOAD = "onLoad";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  function resolveEasycom(component, easycom) {
    return shared.isString(component) ? easycom : component;
  }
  const createHook = (lifecycle) => (hook, target = vue.getCurrentInstance()) => {
    !vue.isInSSRComponentSetup && vue.injectHook(lifecycle, hook, target);
  };
  const onShow = /* @__PURE__ */ createHook(ON_SHOW);
  const onLoad = /* @__PURE__ */ createHook(ON_LOAD);
  const icons = {
    "uicon-level": "",
    "uicon-column-line": "",
    "uicon-checkbox-mark": "",
    "uicon-folder": "",
    "uicon-movie": "",
    "uicon-star-fill": "",
    "uicon-star": "",
    "uicon-phone-fill": "",
    "uicon-phone": "",
    "uicon-apple-fill": "",
    "uicon-chrome-circle-fill": "",
    "uicon-backspace": "",
    "uicon-attach": "",
    "uicon-cut": "",
    "uicon-empty-car": "",
    "uicon-empty-coupon": "",
    "uicon-empty-address": "",
    "uicon-empty-favor": "",
    "uicon-empty-permission": "",
    "uicon-empty-news": "",
    "uicon-empty-search": "",
    "uicon-github-circle-fill": "",
    "uicon-rmb": "",
    "uicon-person-delete-fill": "",
    "uicon-reload": "",
    "uicon-order": "",
    "uicon-server-man": "",
    "uicon-search": "",
    "uicon-fingerprint": "",
    "uicon-more-dot-fill": "",
    "uicon-scan": "",
    "uicon-share-square": "",
    "uicon-map": "",
    "uicon-map-fill": "",
    "uicon-tags": "",
    "uicon-tags-fill": "",
    "uicon-bookmark-fill": "",
    "uicon-bookmark": "",
    "uicon-eye": "",
    "uicon-eye-fill": "",
    "uicon-mic": "",
    "uicon-mic-off": "",
    "uicon-calendar": "",
    "uicon-calendar-fill": "",
    "uicon-trash": "",
    "uicon-trash-fill": "",
    "uicon-play-left": "",
    "uicon-play-right": "",
    "uicon-minus": "",
    "uicon-plus": "",
    "uicon-info": "",
    "uicon-info-circle": "",
    "uicon-info-circle-fill": "",
    "uicon-question": "",
    "uicon-error": "",
    "uicon-close": "",
    "uicon-checkmark": "",
    "uicon-android-circle-fill": "",
    "uicon-android-fill": "",
    "uicon-ie": "",
    "uicon-IE-circle-fill": "",
    "uicon-google": "",
    "uicon-google-circle-fill": "",
    "uicon-setting-fill": "",
    "uicon-setting": "",
    "uicon-minus-square-fill": "",
    "uicon-plus-square-fill": "",
    "uicon-heart": "",
    "uicon-heart-fill": "",
    "uicon-camera": "",
    "uicon-camera-fill": "",
    "uicon-more-circle": "",
    "uicon-more-circle-fill": "",
    "uicon-chat": "",
    "uicon-chat-fill": "",
    "uicon-bag-fill": "",
    "uicon-bag": "",
    "uicon-error-circle-fill": "",
    "uicon-error-circle": "",
    "uicon-close-circle": "",
    "uicon-close-circle-fill": "",
    "uicon-checkmark-circle": "",
    "uicon-checkmark-circle-fill": "",
    "uicon-question-circle-fill": "",
    "uicon-question-circle": "",
    "uicon-share": "",
    "uicon-share-fill": "",
    "uicon-shopping-cart": "",
    "uicon-shopping-cart-fill": "",
    "uicon-bell": "",
    "uicon-bell-fill": "",
    "uicon-list": "",
    "uicon-list-dot": "",
    "uicon-zhihu": "",
    "uicon-zhihu-circle-fill": "",
    "uicon-zhifubao": "",
    "uicon-zhifubao-circle-fill": "",
    "uicon-weixin-circle-fill": "",
    "uicon-weixin-fill": "",
    "uicon-twitter-circle-fill": "",
    "uicon-twitter": "",
    "uicon-taobao-circle-fill": "",
    "uicon-taobao": "",
    "uicon-weibo-circle-fill": "",
    "uicon-weibo": "",
    "uicon-qq-fill": "",
    "uicon-qq-circle-fill": "",
    "uicon-moments-circel-fill": "",
    "uicon-moments": "",
    "uicon-qzone": "",
    "uicon-qzone-circle-fill": "",
    "uicon-baidu-circle-fill": "",
    "uicon-baidu": "",
    "uicon-facebook-circle-fill": "",
    "uicon-facebook": "",
    "uicon-car": "",
    "uicon-car-fill": "",
    "uicon-warning-fill": "",
    "uicon-warning": "",
    "uicon-clock-fill": "",
    "uicon-clock": "",
    "uicon-edit-pen": "",
    "uicon-edit-pen-fill": "",
    "uicon-email": "",
    "uicon-email-fill": "",
    "uicon-minus-circle": "",
    "uicon-minus-circle-fill": "",
    "uicon-plus-circle": "",
    "uicon-plus-circle-fill": "",
    "uicon-file-text": "",
    "uicon-file-text-fill": "",
    "uicon-pushpin": "",
    "uicon-pushpin-fill": "",
    "uicon-grid": "",
    "uicon-grid-fill": "",
    "uicon-play-circle": "",
    "uicon-play-circle-fill": "",
    "uicon-pause-circle-fill": "",
    "uicon-pause": "",
    "uicon-pause-circle": "",
    "uicon-eye-off": "",
    "uicon-eye-off-outline": "",
    "uicon-gift-fill": "",
    "uicon-gift": "",
    "uicon-rmb-circle-fill": "",
    "uicon-rmb-circle": "",
    "uicon-kefu-ermai": "",
    "uicon-server-fill": "",
    "uicon-coupon-fill": "",
    "uicon-coupon": "",
    "uicon-integral": "",
    "uicon-integral-fill": "",
    "uicon-home-fill": "",
    "uicon-home": "",
    "uicon-hourglass-half-fill": "",
    "uicon-hourglass": "",
    "uicon-account": "",
    "uicon-plus-people-fill": "",
    "uicon-minus-people-fill": "",
    "uicon-account-fill": "",
    "uicon-thumb-down-fill": "",
    "uicon-thumb-down": "",
    "uicon-thumb-up": "",
    "uicon-thumb-up-fill": "",
    "uicon-lock-fill": "",
    "uicon-lock-open": "",
    "uicon-lock-opened-fill": "",
    "uicon-lock": "",
    "uicon-red-packet-fill": "",
    "uicon-photo-fill": "",
    "uicon-photo": "",
    "uicon-volume-off-fill": "",
    "uicon-volume-off": "",
    "uicon-volume-fill": "",
    "uicon-volume": "",
    "uicon-red-packet": "",
    "uicon-download": "",
    "uicon-arrow-up-fill": "",
    "uicon-arrow-down-fill": "",
    "uicon-play-left-fill": "",
    "uicon-play-right-fill": "",
    "uicon-rewind-left-fill": "",
    "uicon-rewind-right-fill": "",
    "uicon-arrow-downward": "",
    "uicon-arrow-leftward": "",
    "uicon-arrow-rightward": "",
    "uicon-arrow-upward": "",
    "uicon-arrow-down": "",
    "uicon-arrow-right": "",
    "uicon-arrow-left": "",
    "uicon-arrow-up": "",
    "uicon-skip-back-left": "",
    "uicon-skip-forward-right": "",
    "uicon-rewind-right": "",
    "uicon-rewind-left": "",
    "uicon-arrow-right-double": "",
    "uicon-arrow-left-double": "",
    "uicon-wifi-off": "",
    "uicon-wifi": "",
    "uicon-empty-data": "",
    "uicon-empty-history": "",
    "uicon-empty-list": "",
    "uicon-empty-page": "",
    "uicon-empty-order": "",
    "uicon-man": "",
    "uicon-woman": "",
    "uicon-man-add": "",
    "uicon-man-add-fill": "",
    "uicon-man-delete": "",
    "uicon-man-delete-fill": "",
    "uicon-zh": "",
    "uicon-en": ""
  };
  const version = "3";
  {
    formatAppLog("log", "at uni_modules/uview-plus/libs/config/config.js:5", `
 %c uview-plus V${version} %c https://ijry.github.io/uview-plus/ 

`, "color: #ffffff; background: #3c9cff; padding:5px 0;", "color: #3c9cff;background: #ffffff; padding:5px 0;");
  }
  const config = {
    v: version,
    version,
    // 主题名称
    type: [
      "primary",
      "success",
      "info",
      "error",
      "warning"
    ],
    // 颜色部分，本来可以通过scss的:export导出供js使用，但是奈何nvue不支持
    color: {
      "u-primary": "#2979ff",
      "u-warning": "#ff9900",
      "u-success": "#19be6b",
      "u-error": "#fa3534",
      "u-info": "#909399",
      "u-main-color": "#303133",
      "u-content-color": "#606266",
      "u-tips-color": "#909399",
      "u-light-color": "#c0c4cc"
    },
    // 默认单位，可以通过配置为rpx，那么在用于传入组件大小参数为数值时，就默认为rpx
    unit: "px"
  };
  const ActionSheet = {
    // action-sheet组件
    actionSheet: {
      show: false,
      title: "",
      description: "",
      actions: () => [],
      index: "",
      cancelText: "",
      closeOnClickAction: true,
      safeAreaInsetBottom: true,
      openType: "",
      closeOnClickOverlay: true,
      round: 0
    }
  };
  const Album = {
    // album 组件
    album: {
      urls: () => [],
      keyName: "",
      singleSize: 180,
      multipleSize: 70,
      space: 6,
      singleMode: "scaleToFill",
      multipleMode: "aspectFill",
      maxCount: 9,
      previewFullImage: true,
      rowCount: 3,
      showMore: true
    }
  };
  const Alert = {
    // alert警告组件
    alert: {
      title: "",
      type: "warning",
      description: "",
      closable: false,
      showIcon: false,
      effect: "light",
      center: false,
      fontSize: 14
    }
  };
  const Avatar = {
    // avatar 组件
    avatar: {
      src: "",
      shape: "circle",
      size: 40,
      mode: "scaleToFill",
      text: "",
      bgColor: "#c0c4cc",
      color: "#ffffff",
      fontSize: 18,
      icon: "",
      mpAvatar: false,
      randomBgColor: false,
      defaultUrl: "",
      colorIndex: "",
      name: ""
    }
  };
  const AvatarGroup = {
    // avatarGroup 组件
    avatarGroup: {
      urls: () => [],
      maxCount: 5,
      shape: "circle",
      mode: "scaleToFill",
      showMore: true,
      size: 40,
      keyName: "",
      gap: 0.5,
      extraValue: 0
    }
  };
  const Backtop = {
    // backtop组件
    backtop: {
      mode: "circle",
      icon: "arrow-upward",
      text: "",
      duration: 100,
      scrollTop: 0,
      top: 400,
      bottom: 100,
      right: 20,
      zIndex: 9,
      iconStyle: () => ({
        color: "#909399",
        fontSize: "19px"
      })
    }
  };
  const Badge = {
    // 徽标数组件
    badge: {
      isDot: false,
      value: "",
      show: true,
      max: 999,
      type: "error",
      showZero: false,
      bgColor: null,
      color: null,
      shape: "circle",
      numberType: "overflow",
      offset: () => [],
      inverted: false,
      absolute: false
    }
  };
  const Button = {
    // button组件
    button: {
      hairline: false,
      type: "info",
      size: "normal",
      shape: "square",
      plain: false,
      disabled: false,
      loading: false,
      loadingText: "",
      loadingMode: "spinner",
      loadingSize: 15,
      openType: "",
      formType: "",
      appParameter: "",
      hoverStopPropagation: true,
      lang: "en",
      sessionFrom: "",
      sendMessageTitle: "",
      sendMessagePath: "",
      sendMessageImg: "",
      showMessageCard: false,
      dataName: "",
      throttleTime: 0,
      hoverStartTime: 0,
      hoverStayTime: 200,
      text: "",
      icon: "",
      iconColor: "",
      color: ""
    }
  };
  const Calendar = {
    // calendar 组件
    calendar: {
      title: "日期选择",
      showTitle: true,
      showSubtitle: true,
      mode: "single",
      startText: "开始",
      endText: "结束",
      customList: () => [],
      color: "#3c9cff",
      minDate: 0,
      maxDate: 0,
      defaultDate: null,
      maxCount: Number.MAX_SAFE_INTEGER,
      // Infinity
      rowHeight: 56,
      formatter: null,
      showLunar: false,
      showMark: true,
      confirmText: "确定",
      confirmDisabledText: "确定",
      show: false,
      closeOnClickOverlay: false,
      readonly: false,
      showConfirm: true,
      maxRange: Number.MAX_SAFE_INTEGER,
      // Infinity
      rangePrompt: "",
      showRangePrompt: true,
      allowSameDay: false,
      round: 0,
      monthNum: 3
    }
  };
  const CarKeyboard = {
    // 车牌号键盘
    carKeyboard: {
      random: false
    }
  };
  const Cell = {
    // cell组件的props
    cell: {
      customClass: "",
      title: "",
      label: "",
      value: "",
      icon: "",
      disabled: false,
      border: true,
      center: false,
      url: "",
      linkType: "navigateTo",
      clickable: false,
      isLink: false,
      required: false,
      arrowDirection: "",
      iconStyle: {},
      rightIconStyle: {},
      rightIcon: "arrow-right",
      titleStyle: {},
      size: "",
      stop: true,
      name: ""
    }
  };
  const CellGroup = {
    // cell-group组件的props
    cellGroup: {
      title: "",
      border: true,
      customStyle: {}
    }
  };
  const Checkbox = {
    // checkbox组件
    checkbox: {
      name: "",
      shape: "",
      size: "",
      checkbox: false,
      disabled: "",
      activeColor: "",
      inactiveColor: "",
      iconSize: "",
      iconColor: "",
      label: "",
      labelSize: "",
      labelColor: "",
      labelDisabled: ""
    }
  };
  const CheckboxGroup = {
    // checkbox-group组件
    checkboxGroup: {
      name: "",
      value: () => [],
      shape: "square",
      disabled: false,
      activeColor: "#2979ff",
      inactiveColor: "#c8c9cc",
      size: 18,
      placement: "row",
      labelSize: 14,
      labelColor: "#303133",
      labelDisabled: false,
      iconColor: "#ffffff",
      iconSize: 12,
      iconPlacement: "left",
      borderBottom: false
    }
  };
  const CircleProgress = {
    // circleProgress 组件
    circleProgress: {
      percentage: 30
    }
  };
  const Code = {
    // code 组件
    code: {
      seconds: 60,
      startText: "获取验证码",
      changeText: "X秒重新获取",
      endText: "重新获取",
      keepRunning: false,
      uniqueKey: ""
    }
  };
  const CodeInput = {
    // codeInput 组件
    codeInput: {
      adjustPosition: true,
      maxlength: 6,
      dot: false,
      mode: "box",
      hairline: false,
      space: 10,
      value: "",
      focus: false,
      bold: false,
      color: "#606266",
      fontSize: 18,
      size: 35,
      disabledKeyboard: false,
      borderColor: "#c9cacc",
      disabledDot: true
    }
  };
  const Col = {
    // col 组件
    col: {
      span: 12,
      offset: 0,
      justify: "start",
      align: "stretch",
      textAlign: "left"
    }
  };
  const Collapse = {
    // collapse 组件
    collapse: {
      value: null,
      accordion: false,
      border: true
    }
  };
  const CollapseItem = {
    // collapseItem 组件
    collapseItem: {
      title: "",
      value: "",
      label: "",
      disabled: false,
      isLink: true,
      clickable: true,
      border: true,
      align: "left",
      name: "",
      icon: "",
      duration: 300
    }
  };
  const ColumnNotice = {
    // columnNotice 组件
    columnNotice: {
      text: "",
      icon: "volume",
      mode: "",
      color: "#f9ae3d",
      bgColor: "#fdf6ec",
      fontSize: 14,
      speed: 80,
      step: false,
      duration: 1500,
      disableTouch: true
    }
  };
  const CountDown = {
    // u-count-down 计时器组件
    countDown: {
      time: 0,
      format: "HH:mm:ss",
      autoStart: true,
      millisecond: false
    }
  };
  const CountTo = {
    // countTo 组件
    countTo: {
      startVal: 0,
      endVal: 0,
      duration: 2e3,
      autoplay: true,
      decimals: 0,
      useEasing: true,
      decimal: ".",
      color: "#606266",
      fontSize: 22,
      bold: false,
      separator: ""
    }
  };
  const DatetimePicker = {
    // datetimePicker 组件
    datetimePicker: {
      show: false,
      showToolbar: true,
      value: "",
      title: "",
      mode: "datetime",
      maxDate: new Date((/* @__PURE__ */ new Date()).getFullYear() + 10, 0, 1).getTime(),
      minDate: new Date((/* @__PURE__ */ new Date()).getFullYear() - 10, 0, 1).getTime(),
      minHour: 0,
      maxHour: 23,
      minMinute: 0,
      maxMinute: 59,
      filter: null,
      formatter: null,
      loading: false,
      itemHeight: 44,
      cancelText: "取消",
      confirmText: "确认",
      cancelColor: "#909193",
      confirmColor: "#3c9cff",
      visibleItemCount: 5,
      closeOnClickOverlay: false,
      defaultIndex: () => []
    }
  };
  const Divider = {
    // divider组件
    divider: {
      dashed: false,
      hairline: true,
      dot: false,
      textPosition: "center",
      text: "",
      textSize: 14,
      textColor: "#909399",
      lineColor: "#dcdfe6"
    }
  };
  const Empty = {
    // empty组件
    empty: {
      icon: "",
      text: "",
      textColor: "#c0c4cc",
      textSize: 14,
      iconColor: "#c0c4cc",
      iconSize: 90,
      mode: "data",
      width: 160,
      height: 160,
      show: true,
      marginTop: 0
    }
  };
  const Form = {
    // form 组件
    form: {
      model: () => ({}),
      rules: () => ({}),
      errorType: "message",
      borderBottom: true,
      labelPosition: "left",
      labelWidth: 45,
      labelAlign: "left",
      labelStyle: () => ({})
    }
  };
  const GormItem = {
    // formItem 组件
    formItem: {
      label: "",
      prop: "",
      borderBottom: "",
      labelWidth: "",
      rightIcon: "",
      leftIcon: "",
      required: false,
      leftIconStyle: ""
    }
  };
  const Gap = {
    // gap组件
    gap: {
      bgColor: "transparent",
      height: 20,
      marginTop: 0,
      marginBottom: 0,
      customStyle: {}
    }
  };
  const Grid = {
    // grid组件
    grid: {
      col: 3,
      border: false,
      align: "left"
    }
  };
  const GridItem = {
    // grid-item组件
    gridItem: {
      name: null,
      bgColor: "transparent"
    }
  };
  const {
    color: color$3
  } = config;
  const Icon = {
    // icon组件
    icon: {
      name: "",
      color: color$3["u-content-color"],
      size: "16px",
      bold: false,
      index: "",
      hoverClass: "",
      customPrefix: "uicon",
      label: "",
      labelPos: "right",
      labelSize: "15px",
      labelColor: color$3["u-content-color"],
      space: "3px",
      imgMode: "",
      width: "",
      height: "",
      top: 0,
      stop: false
    }
  };
  const Image = {
    // image组件
    image: {
      src: "",
      mode: "aspectFill",
      width: "300",
      height: "225",
      shape: "square",
      radius: 0,
      lazyLoad: true,
      showMenuByLongpress: true,
      loadingIcon: "photo",
      errorIcon: "error-circle",
      showLoading: true,
      showError: true,
      fade: true,
      webp: false,
      duration: 500,
      bgColor: "#f3f4f6"
    }
  };
  const IndexAnchor = {
    // indexAnchor 组件
    indexAnchor: {
      text: "",
      color: "#606266",
      size: 14,
      bgColor: "#dedede",
      height: 32
    }
  };
  const IndexList = {
    // indexList 组件
    indexList: {
      inactiveColor: "#606266",
      activeColor: "#5677fc",
      indexList: () => [],
      sticky: true,
      customNavHeight: 0
    }
  };
  const Input = {
    // index 组件
    input: {
      value: "",
      type: "text",
      fixed: false,
      disabled: false,
      disabledColor: "#f5f7fa",
      clearable: false,
      password: false,
      maxlength: -1,
      placeholder: null,
      placeholderClass: "input-placeholder",
      placeholderStyle: "color: #c0c4cc",
      showWordLimit: false,
      confirmType: "done",
      confirmHold: false,
      holdKeyboard: false,
      focus: false,
      autoBlur: false,
      disableDefaultPadding: false,
      cursor: -1,
      cursorSpacing: 30,
      selectionStart: -1,
      selectionEnd: -1,
      adjustPosition: true,
      inputAlign: "left",
      fontSize: "15px",
      color: "#303133",
      prefixIcon: "",
      prefixIconStyle: "",
      suffixIcon: "",
      suffixIconStyle: "",
      border: "surround",
      readonly: false,
      shape: "square",
      formatter: null
    }
  };
  const Keyboard = {
    // 键盘组件
    keyboard: {
      mode: "number",
      dotDisabled: false,
      tooltip: true,
      showTips: true,
      tips: "",
      showCancel: true,
      showConfirm: true,
      random: false,
      safeAreaInsetBottom: true,
      closeOnClickOverlay: true,
      show: false,
      overlay: true,
      zIndex: 10075,
      cancelText: "取消",
      confirmText: "确定",
      autoChange: false
    }
  };
  const Line = {
    // line组件
    line: {
      color: "#d6d7d9",
      length: "100%",
      direction: "row",
      hairline: true,
      margin: 0,
      dashed: false
    }
  };
  const LineProgress = {
    // lineProgress 组件
    lineProgress: {
      activeColor: "#19be6b",
      inactiveColor: "#ececec",
      percentage: 0,
      showText: true,
      height: 12
    }
  };
  const {
    color: color$2
  } = config;
  const Link = {
    // link超链接组件props参数
    link: {
      color: color$2["u-primary"],
      fontSize: 15,
      underLine: false,
      href: "",
      mpTips: "链接已复制，请在浏览器打开",
      lineColor: "",
      text: ""
    }
  };
  const List = {
    // list 组件
    list: {
      showScrollbar: false,
      lowerThreshold: 50,
      upperThreshold: 0,
      scrollTop: 0,
      offsetAccuracy: 10,
      enableFlex: false,
      pagingEnabled: false,
      scrollable: true,
      scrollIntoView: "",
      scrollWithAnimation: false,
      enableBackToTop: false,
      height: 0,
      width: 0,
      preLoadScreen: 1
    }
  };
  const ListItem = {
    // listItem 组件
    listItem: {
      anchor: ""
    }
  };
  const {
    color: color$1
  } = config;
  const LoadingIcon = {
    // loading-icon加载中图标组件
    loadingIcon: {
      show: true,
      color: color$1["u-tips-color"],
      textColor: color$1["u-tips-color"],
      vertical: false,
      mode: "spinner",
      size: 24,
      textSize: 15,
      text: "",
      timingFunction: "ease-in-out",
      duration: 1200,
      inactiveColor: ""
    }
  };
  const LoadingPage = {
    // loading-page组件
    loadingPage: {
      loadingText: "正在加载",
      image: "",
      loadingMode: "circle",
      loading: false,
      bgColor: "#ffffff",
      color: "#C8C8C8",
      fontSize: 19,
      iconSize: 28,
      loadingColor: "#C8C8C8"
    }
  };
  const Loadmore = {
    // loadmore 组件
    loadmore: {
      status: "loadmore",
      bgColor: "transparent",
      icon: true,
      fontSize: 14,
      iconSize: 17,
      color: "#606266",
      loadingIcon: "spinner",
      loadmoreText: "加载更多",
      loadingText: "正在加载...",
      nomoreText: "没有更多了",
      isDot: false,
      iconColor: "#b7b7b7",
      marginTop: 10,
      marginBottom: 10,
      height: "auto",
      line: false,
      lineColor: "#E6E8EB",
      dashed: false
    }
  };
  const Modal = {
    // modal 组件
    modal: {
      show: false,
      title: "",
      content: "",
      confirmText: "确认",
      cancelText: "取消",
      showConfirmButton: true,
      showCancelButton: false,
      confirmColor: "#2979ff",
      cancelColor: "#606266",
      buttonReverse: false,
      zoom: true,
      asyncClose: false,
      closeOnClickOverlay: false,
      negativeTop: 0,
      width: "650rpx",
      confirmButtonShape: ""
    }
  };
  const color = {
    primary: "#3c9cff",
    info: "#909399",
    default: "#909399",
    warning: "#f9ae3d",
    error: "#f56c6c",
    success: "#5ac725",
    mainColor: "#303133",
    contentColor: "#606266",
    tipsColor: "#909399",
    lightColor: "#c0c4cc",
    borderColor: "#e4e7ed"
  };
  const Navbar = {
    // navbar 组件
    navbar: {
      safeAreaInsetTop: true,
      placeholder: false,
      fixed: true,
      border: false,
      leftIcon: "arrow-left",
      leftText: "",
      rightText: "",
      rightIcon: "",
      title: "",
      bgColor: "#ffffff",
      titleWidth: "400rpx",
      height: "44px",
      leftIconSize: 20,
      leftIconColor: color.mainColor,
      autoBack: false,
      titleStyle: ""
    }
  };
  const NoNetwork = {
    // noNetwork
    noNetwork: {
      tips: "哎呀，网络信号丢失",
      zIndex: "",
      image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEsCAYAAAB5fY51AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAABLKADAAQAAAABAAABLAAAAADYYILnAABAAElEQVR4Ae29CZhkV3kefNeq6m2W7tn3nl0aCbHIAgmQPGB+sLCNzSID9g9PYrAf57d/+4+DiW0cy8QBJ06c2In/PLFDHJ78+MGCGNsYgyxwIwktwEijAc1ohtmnZ+2Z7p5eq6vu9r/vuXWrq25VdVV1V3dXVX9Hmj73nv285963vvOd75yraeIEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQaD8E9PbrkvRopSMwMBBYRs+5O/yJS68cPnzYXel4tFP/jXbqjPRFEAiCQNe6Bw/6gdFn9Oy9Q90LLG2DgBBW2wyldIQIPPPCte2a5q3jtR+4ff/4wuBuXotrDwSEsNpjHKUXQODppy+udYJMEUEZgbd94DvnNwlA7YGAEFZ7jOOK78Xp06eTTkq7sxwQhmXuf/754VXl4iSstRAQwmqt8ZLWlkHg0UcD49qYfUjXfLtMtOZ7npExJu4iqZWLl7DWQUAIq3XGSlpaAYHD77q8xwuCOSUoXw8Sl0eMux977DGzQjES3AIICGG1wCBJEysj8PXnz230XXdr5RQFMYbRvWnv6w8UhMhliyGwYghr4Pjg3oEXL34ey9zyC9tiD2ml5h47dr1LN7S6CMjz/A3PvHh1Z6UyJby5EVgRhKUe7Kz/JU0LfvrJo5f+Y3MPibSuFgQGBgasYSd9l6GDsup0WS/T/9RTp9fXmU2SNwECdQ92E7S57iaMeJnPQLK6ixkDLfjlb7546RfrLkQyNBcC3dsP6oHWMd9G+V3JgwPHh7rnm1/yLQ8CbU9Y33zp0j+nZFUMb/DHmB7+SHGY3LUKAk8cObtD00xlHDrfNge+Z2ozU3c9dvx4Yr5lSL6lR6CtCWvg6OAPw9z538ZhhZRl6XrwhW8du1KX/iNejtwvPQIDR8+vSRqJ/obU7GupjdNdh2gW0ZDypJBFR6BtB2rg2OVtuub9JcmpHIpBoK1xfffLzx4f7C0XL2HNiYDp6bs9z23Ypn1fC1Y/9PCFDc3ZW2lVHIG2JKzTp4Ok7nv/G6Q054MIvda+bNb74pEgKGtwGAdL7pcfAa8vOKEZ2kyjWuLr7uDh+/qvN6o8KWdxEWhLwroyeek/g4zuqwU6kNrhyZcu/UktaSXN8iNwuL9/RuvVXtJ9PbPQ1vhmcP6t9+47u9ByJP/SIdB2hDVw9MJHQFYfrQdCph84evFX68kjaZcPAZJWwjMXRFpJ2zr91tfuvrh8vZCa54NA2xGWrunvmg8QWCJ/N4ir7fCYDxatkOeBB7an501agXbygVdvv9IK/ZQ2FiPQdi9osGbH+zRNf7y4m9Xu9Me7N9nv0HXdr5ZS4psHgXpJC9P/wDRTx0Vn1TxjWG9LGrbaUm/Fi5meSvcrkxf/Cg/ow9XqAUk91v3qHT97r6471dJKfHMi8Oyzgx1Z03t1YAQVT2MwgsC3u+yXHzi0faQ5eyGtqgWBtpOw2Ol9+/TM+sTOn8L08MtzgQCy+tOHXr3jA0JWc6HU/HF5Scssr4jXcYqfP6V/T8iq+ceyWgvbUsKKOn38eJAYyl56TAuCEr2WYei//9Crd/5GlFb81kdASVopSFrerKRlaoZj9HR+700H10+0fg+lB21NWBxe2lhNHsUpDZr27mi4dV379R9+za4/iO7Fbx8ECknLCPTsTDJ17O33bJpqnx6u7J60PWFxeAcCbMV56dJfQKf1bkMLfuGh1+76zMoe9vbuPUnLsb2DtmOe5HSxvXsrvWtLBEhaTx29+Ma27Jx0ShAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQaEsEVoQdVluO3BJ06ptHL34b1XRjp4Ch6Rq24+kmjG4Nwwg+9uA9u/73EjRBqhAEihAoe3xwUQq5WTYEzp0b3ZnV/Ncf6O/9AvY9wlh/6dy3X7ncN512Zw9BVLXjuAP4np44vnQtkZoEgVkEhLBmsWiKqwsXpjbPBOn3gRfenwnc+7GBe+zsjclvonFDS9nA9Iy/u3x9+vAP3735VPk4CRUEFhcBIazFxbfm0k9fHD7k+v4nQFaPQIrx8Gmyx/GJ0J/t7ez7mw0b9MmaC2pQQgh0/ZSm4g5TwueWWtqLt0HuVy4CQljLPPYnB0depTn+b3t+8B4t0AdBUv93h2H9xc6da0aXs2m+r1WQsLRnl7NdUvfKRkAIa5nG//r1oGtsZvjTgev/kqYHF/TA+AXoqv4npJemOEiQU1Eo2l+G0movBK1UBBPU7s9E1+ILAkuNgKwSLjXiqO/khVtvARH8dxDBRkMzPrF/V+9/BlG5y9CUqlXinHv9mRPXtvuus88L9H3JPv2zD2yXExCqAicJBIFWRwAvv3Xqwq0/Pnn+lv/K+ZvfPH3p9p5W75O0fxaBp793ce3AwIDMWmYhafiVgNtwSMsXeHp4eNXJC8Nf0PAdRCiuf/XgrnWUqsqotcvnl9DmRkCdweX4b9N7+m/ih+mbMraLM14yJVwcXItKpT1VRve+ArC3Qqn+3gM7132jKEGZm6tXg86J7OhDfuA/iHwPUpfUZSfu2L59tXxEoQxeyxkEgjKeOnLxHb4RqC+NY5H3+2953d4XlrNN7Vq3ENYij+yZwbG9jpt9GkBPQ5H9zgP9607OVeWp87cOQtn9zwJf+xDMNFfj+jryPqXpxj8c2Nn7P+SXey70lidu4IXzb0DNB4tr9751+HV7zxSHyd1CERDCWiiCc+QPjUCnsaqmZ62O5IN7N/VUNP48ee7mAZDTf4Tt049iUG4Guv4ZfNLos9UIbo7qJWoJEHjy+bP7fNsoOcnW0A0/aacef8PdG28sQTNWTBVCWIs01OfPj66BpfqTmq732UnjgT1bei+Vq4pTv7HM8Ceg2/o1qLQug7T+FaaM3IqTLZdewpoHgYEjV9fphvOj+OShWa5V+CxvZtpzv/LwG/aNl4uXsPoRwI+4uEYjAJ2GmdG8L0FK2mYa+tsrkdXZy+P7x2ZuHdW14P+BLdank9q6Qwd3rf+ckFWjR6Tx5Q2cP58K9Jm3VCIr1ogt48lO237r3//96YofeG18y9q7RFklXITxPXV+5DchKb3ZDMy37Nu5tuxG4R9cHH6b42QfAzlds+3EPXu2rfrBIjRFilwkBIIR7SHoJDurFU89ZOd680Gke6JaWomvjoBIWNUxqivFD87fej0e0n8Fwvr0/t1rnyqX+QfnRz7g+8FX8Rv8vL3auF/IqhxKzR2WCPxXqKeq3krDTdj2ierpJEUtCIgOqxaUakwzNBR0D09yiqePHOjveyOkpxLr9VMXb73V97S/h3nDXx7Y2fdPkAYbncW1IgIDxy5vM7LZt/hgrnLtxyaBrJNxv/72N+6tuNhSLp+EVUZACKsyNnXHvHL+1qcgNf2KbSXu2bt9dcmS9qlzo/fARgcmCtpzB3b1/Vg5QiuslLowENyDWDn8cSjl98PgdBviu03N+rl9/WufLEwr18uDwLdevLTF1YK3xnVZ2HI1bUxrT7z5zTuXdRP78qCyeLUKYTUI25OXbm4JPO00TBj+6I7+db8ZL3ZwMOiYdG4dA1lN9HWte2iuI2NAVPapC8O/CGPR34Ip/AZIbIMo7yX8G9QMbcS09P+2b1vf5XgdrXaPfiYns9oeLLEd8D1/B7Dp0E1jGP042pXQj7RKf546cmGzp+tv1TRf6YQD35/QO3seP3xow5IfC9QqmM23naJ0ny9ysXwgq98BWc0kVhv/Nhalbqe8kd/Fr8MOSEr3zEVWrwyO3I29hl+E9LUHGf+nAXI6sGPdd8uV2YphIKnE5IyL6bLxk7cn3bdkHHefrpvJAExMZ1uBZmqeNzXtfzUzk/m/ens7LjV7Px+8d9e1579/44l0duZtge+Np5zEEw8c2pBu9na3YvtEwmrAqNE8IZvNHsep5//yjl3r/0O8yFOXbv0QCO05gP0JGIL+fjw+uj91YeRh/Dp/PtCDM7Zpfmjvjt6Xo7hW9ycmJjaYduf7Hdf/8HTGfa3rG9rYxLSWnsloPg7fijZV8oFM2Ja2a9t6EJd7bCztvHP7us4rrdD/r3/7ct9I99jEI4cOiQ3dIg2YEFYDgOUJDFj1e8TqX7cT4kImXuQr5279A4DeBEX8ayvprU4N3rovcALot/TH13T0fXDTJn0qXk4r3k9OTm4y7a6PzjjORzOOvn1kbEqbnEprPhRzwAKzwFLHk05hv6Yd6N+o3R6beG50aPSdr3qV6IJKkVp5ITIlXOCYn4Yexr0w/DO6YXymHFlR0e5r7tsM3fxgJbI6fW1ivTeT+SsYmr54cFff+5Cu5X+hb94Merp6/J/PusGvTE6724eGJ7RpSFOkKPCUZvBPBccoHBet3Rwe13rX9tw/PjXzZ5hKvr8SfhWKkeA2REAIa4GD6p0feRdWBnvxjv2PckVhVfBf4A29uG/X2i+Ui2eYn8n8NryuDr3jPfWSFV5k44UT137eshIP2K7/64cObbheqZ6lCp+Ydt8TBO7vTM5od1+/NR4SFVhoLpKKt410lnE8LTMzo3V2dLznxLkhYgQ9obiVjEDln7mVjEodfYcpw+MAsftg/7qSDbAnb97sCSb0Yei2fqOcbovVqKNnNO8HmAE9Cv3Wp+uoWjt27HpXNqH9WTKR+kBHKqEFbvo5y3N/avfu4g23R45f3WGa1k9ZicTd0zPTf/f6O7f8dT311Jp2fHzmgJlI/N70jPPe4bEZ6Kg4qw0lqlrLiNKBiLWerpTW25PUbkPXZViW62ecHz+4d8PXojTirzwEyhq8rTwYFtRjvpX/rlwJ+iSXugPbMuyKBOHo3geRJtuT7PujcmVUCuPJlhnL/9NUqvMD2eyM5sxMaIlE4n7XML907tyNjcxHQjty4sZv66Z1xEok/xNW5n4uZSf+8sT5m++vVO58wkEu5sR09pd9w/rWyET2vReujiqygrSopn/zKZN5qMeirotKeTyolm7p/+X06Wvr51ue5Gt9BISwFjiGsLl6N6SrvylXDNTK70D4mX071pwtF88w6Jd/DG/1E1u26NOV0pQL71y3/8PJVOcHMzPTWkcCH2YGOaTTaS2RTN6f1fQvvvDK1bdnbO2JZCr1SeRfn05Pa1PTU0gXJBKW+ecnzlxvCGndhFQ1NRP8bcY1/vjS9bF1V26MwHwsVKiXa3etYVw1TNhYJ3TDjQCO42jJVMcez7J+t9YyJF37ISCEtahjGjxkGDr2DJZ31D8h5vUQJL5RPkXlUMM07u3qSGidICvkzzuSlmlZb0olrK9hD9v9JCrPC196JoPMAolFg6CV+PPj54YeyWecx8Vk2v1Q0rSfhFT18LnBmzBRyNalp5qrSuq7kiAsh4SFa7oZ9M0wzI+cPHOjZPo9V1kS1z4ICGEt4lhiCvZrSa2jol7qzPXJPk6nIGbVbWfUvcr7hO9MP97ZVXpggOu6ajplYStj7l1XvbRMXbPAbp6HzSSBlkraNknrvfVCcPt2sHYi7f3pTDb47KUbYxuvKqkKpYBXKBnV869c3WgbDEixAck0FGFFfEzJzbIsO9C1TyrcymWWsLZGIHoW2rqTzdo5dXyykz0NC8l779i5vu4zwM+eHVntGP5jqVTq/6AkVc5NZ3wNH2lVxNWZNIukMSjiNd9z0+CHp5DXAdX4SAg203w8GB5IATtODHzdK8C15kEjhXvNS9rWA11dnfcMDY9prscss48RySakrOLWqODCoIKAgkuVgsS0urtD60haeV1YYVbbtjUn6/74HXvW/11huFy3PwKzT1r797Upe3jq4sib9u9Y+wxe+vh7W1N7jx49v6ZzbffnQD4/Cj1Pfjx54XiBls6GVuTUc9mQsOIO9mPQFdkIRlz4fy5JLm2ZMOqTcJaXIqpcqnixVe+rdbZ3dbc2OT0D0wZIibHSksmklslknvx+//q3PiKnXcTQae/b+LPQ3r1t0969cOL6G7o6E09qgZegdMJBpVQ1DbKCpyUt6oPKz/4NEJalCAuZFIuEVBJd+jgLh4rvAiFqUVGkhJZMWFp3Z0obGSu/d5gSnWmavuO6h+/cvYHSobgVgoAYjrb4QPMUiGtj1/79jBMkLBwiTlMASlYzTkhWCJyTrGAyMOFkst/BoYMmuIIyGJYcMXMMdNwHPhYN1qWS1t6ZLGaKZL8yzFXTr15BooLLMugHMBRNKgW+It8y9TEcJGt4rvcRFCCEVQbFdg0Swmrxkb0+cf2XOzq73kgdFieEXF2jdEUJKQH6SVWQrNjtZDKlpTPp38U58iUbthk/Ph7sN6zg/xudSGvD4xkq6otcnnjyF0XRRTflkyC0IIJE1JG0QbqGNpMNp5xFhRTcZDNoj66988SFm5vv3LX+WkGUXLYxAuXnCW3c4XbqGs9hwjv+a9lsuN+ahOJSCoLjNDAFvVUll0p1aNPp6adTweSflEszPO48oFn+4yOTmR+6enOshKyYhzWpf/jDuuf6x2aV/qNRaPG/1d0gUXWCA0uu7GhMmkqmerEc8KOVU0lMuyFQ+Ylut562YX9Sncmf7Ojo3BDZWbGLtMkiUVXSWTFNuMqWuYG530f7+/tnGFboxsfdd9mm8XdDo9O7rg6NFq0CFqZr5DWlK9qV0fZqGvZchSuPlevB2VmG/hOV4yWm3RAQwmrhEcW64qu4ykfJho52Vp3J8quBYQooqWDKADftBd6HD+5efyoKj/zR8ew/hWXY56/cnFh7a3RCTTGjuMX0SVB9qzu1qfQM+jO3dBW1g6uVSHv/qVNX10Vh4rc3AkJYLTy+WA/8ou9kJjo7bOh+DLVFZ64TEbCyBktxI5PJZj56R//Gx+NdH5vM4vuI+p8NXh9LjU1iw3EZhXc8TyPuuV9wDaaCfBjTM06N0hVWQmHBDzvSDZ5tvqYR7ZAymh8BIazmH6OKLbzv0KZvJEz3ZzEFnEolaEtV2XEaCLKadrIz//TQnk1/EU85NuH8th8Yf4j9gMZUOrNkZEVZCnsbtTU9KW18GqcKFyjh420sd2+j33pg3F8uTsLaDwEhrBYf04O7N/2t7/o/C2FoGnsIy/YGlvAwSfCvZzLOe+8oR1ZT3u/5uvHJC9dGtJlMrfqjslXVHwjpat2aLi2rjFFLjUSrFUjlO0juddXSSXx7ICCE1QbjiHO0/hofbPgwpnDTOR2V6hWNQqGUx34890noet5yaO+Gko3Y45PO7/uB/lvnrwxrWdha1absbgxo1FWtwplXqYSJY5Nn5lU3bLHQmGA/yko0plVSSjMjIITVzKNTR9sO7dv8RSeb/T9BWmMkKv4D+YzBXuljV7yxd+zfte6VeHGKrHTz4+cv38JWmyUmKzSGG5z7VndoE7kz3uPtq+Welvhwm39weVjOyaoFsBZPI4TV4gNY2Pw79mz8KyebeRIH+VEZTaX0sf27+v794TKmCxNTzr/2NOPj5wZBVjjdYSklq6jN69dyKuhqmWztivYob+RTSkPbe/xMdlMUJn77IiCE1W5jq+s4dYEO6mzsYAmvi/+CrH7LDYxPcBq4HGTFVcG1ULLT5orS1ULIkoSFI2cMHKG8obiXcteOCAhhtdmo6gaOh4EWWlkyYU9gvHswXfgV19d/7+LVkSWfBrItJJhObL/p7elQR8fUZnEV70XxPc01sM+xrzhU7toRgZIHuh07uZL6xA3LBaYB+Ar8rBsfz34YX1j+D5eu317QNGy2xPquSE4mDuXb2IujY2AgytNE67RiKFshzuwCR5s9ZSMlsK0QEMJqq+GkBKOF5yFzRoidK5BoFCeMjM/8mG+a//Xy0Li55KYLBRiTrGjwOQ1br4VMBQuKVJeQKVPxMLlvPwSEsNpsTEECmBLSgbHUpwD1YGwse59l2p+9fmuig4fiNZIowrqq/6Xeqm9Vh9JbjcOKvqFtACX7gV8kTVZvkaRoRQSEsFpx1OZoM2iKxxuHLtDcsZlgLzYZfv7m7XSv+r7fIm234XSP/8o5ktWqzqSyZr89PoXPYDTYkZvziw0NLluKayoEyq4iNVULpTF1IaDjHHZmoAW4aep9geN8fiLt998cGYdtVp7K6iqzXGJFUCAi7jdkuapsBJKcPBwgyP8YRyV7B04Q3dDbpY3jg6gupoMNla5U41BbUN9n0sr1ScKaHwEhrOYfo7paCAW0WiWknihhW/0Tabf/6tDtxpIVSIhGnz1dSXUkDL8fSHKi4/lWPId9Kp3Vxqegp8J/m9f14D6DQ/nmb281FwgkZ1Dj7bnSSFx7ICCE1R7jmO8FJJr8jCvjeNrIxFjDJBpKVaSlXhwDw384MyucBoLAGEfHI5ptO6n1YAq4FjorH9IWjUOnFlF3pj62aui3whbI33ZGQAir/UY3XCVEvzgdw/8NcSyGUhSlpVWQrFg2p39xp0JYLyIohaXxdZ2FGofG6yi85/QS32F0Asu8URgu1+2JgCjd22xcsVElPC85169Gaa1YTkRWJKpSqooBiQQzONvq9sRULKKxtzzAEJw1api2EFZjoW3K0oSwmnJY5tcoSD09HanEDztubnfO/IopyUWC6sUmZUpW5aSqkgwgK04DxxaZrFivacCaIdAuH9zaM1rSDgloOwSEsNpoSMenvU93dXb+EE5taFivKElRqd67qrNmsqIF+yjMF/i56MV2JqadYKxXMDXM6+4Wu04pf/kQEMJaPuwbWvPticwj4Il/NnTrdl7JrqaDC5wTUle1GmdWWVCw1+JotjA6PgnThsIdQrXknF8arkJi/+R355dbcrUaArU9ha3WqxXW3tHR9C5dN//T9eEJ3aGdUwP7T0V7F86Mr0VW4mF6o2NTS/ilaB2HDmb8wA2+08AuS1FNjIAQVhMPTi1NgwRkGKbxRxMz3uaJSRzVUkumOtLwo6Zc7aOkVdEhynN9NQ1cyuNqeEqD67mX9TXGyxXbJhFthYAQVosP58S0909czfqJqzdGODVqaG/IUbCWr2p0yukfp4FUtDfeir1yl8IPUGjPHFy/fqJyKolpJwSEsFp4NEfT6Z3YBvOp8MvMc0hAi9hHNQ1cBrJil5TUZxhfXsTuSdFNhoAQVpMNSD3NMTzzU1PZYAM/ProYkg3UV5rHT8lXmA7SwnwEq4FLLVkRI04HM+n0LdvzvlEPZpK2tREQwmrR8ZucCd7hePr7rw2N5PfxLUZXON1zHKz4kb0KnIttP6Njk8tyaimbwXPrsW/yq3v3bhoqaJZctjkCQlgtOMCYCnU4GedTI+NpQ32XbxH7QOmKG5nzdIWZJz8HNkKygqI9TmSL2JSiovGVn0A39c8WBcpN2yMghNWCQ4zPc0HRbr6GEs6chJFnmfl3knZO4/hmII1B6fiFG9br0s6qAeXPp2WUrhzHeXH/jr6n5pNf8rQuAkJYLTZ2kK7Wul7w6zeGx9DyUsZovOodOizosTg1TM9k1Wogpa7lIisOF+w48E/7E5B1Y/cgtdizsBKbK6c1tNioT6X9n3MDcyePOo7OoJqrC6S0+ZIYV+GSOHxvc18PJCxXG4ed13I727axqTp9yk9rX1jutkj9S4+ASFhLj/m8axwdDdbgELxfGsLpoZyqVXPVU1QugVJUV0dC27p+FaaBWWxknq6ceAljTNMiAf/BoUMbJpewWqmqSRAQCatJBqKWZpgJ731Zx9pJM4aK0hXe5vlKVFEbKFlxs3PvqpSSqpbzKztRm+gnEkktnU6/2GFMfa4wXK5XDgJCWC0y1iAR6/Z49iOjY7C5qkG6mk+3SFQGlEP8FFdnygrNFqBsn1OxP5+K5pGHbcBhqhT8fqu/v39mHkVIljZAQAirRQYx7Wj3Zj3tddQjVVJ4l50CMjHe8mqOTJCCvmoTyIrENXx7Uinbm4Gs2PZUqkObnp76i0N7N36tWl8kvn0RaGnCGhgILKPn3B3+xKVXDh8+nPseX3sOlpt13+P4uonv71WeDqLr1ampFB8S1JrulNaHc9rTMxltcpofOeWns0rTLkeIZUHRnpm5YibMf7kc9UudzYNAyyrd8ZLpWvfgQT8w+oyevXeo++bBtaEtQd9s1/ffRsV3I6eDJCp+nourgH04UZQnhIYfWm1o8xdUGCU8/E/bil89sH3dlQUVJplbHoGWJaxnXri2HTvd1nEEcCBS3z++MLi75UejQgcmJjL92ax/gNJPo6QekhVXAbdvXI3D+XQ1Bcxiu02zTAEjKFIdHTQS/S8Hd2/4YhQm/spFoCUJ6+mnL651gkwRQRmBt33gO+c3teNQYin/oG6aKX5rcKEukqqoWN+Ij5vy81v8UATDG0WGC21jlJ96K6wKPpWd8H8jChN/ZSPQcoR1+vTppJPS7iw3bIZl7n/++eFV5eJaOczX9Z2YvM1LPxWpocBHKv8qHHdMqSphGUqqahaThfj40ITBcbLnsDj6oXvu2bS4n96JVy73TYtASxHWo48GxrUx+5Cu+XY5RH3PMzLGxF0ktXLxrRoGNVPPfNtOolIrgElLGYH2wbZqcipdIFVFlDbfGhqfj9bskCaHHS/7gTt3r73Y+BqkxFZFoKUI6/C7Lu/Bl1jmlKB8PUhcHjHufuyxx/g5lbZw+BL7bX4EoiZqyS0T0uM0j1+82QSl+ua+bhxj7GjD2LicwWkLzaarigbKsmDJ7gcTmezMBw/t3ixntUfAiK8QaBmzhq8/f26j77pbaxo3w+jetPf1B5D2RE3pmzyR4/nH+Mti4Wx1dUrCHO0lSVGqskFUnakkpn6mhu086jgYHkWTW3Wbo4Tli6L5gqYHE47vfeDufVv+YflaIjU3KwItIWEdO3a9Szc0ElDNDqcLbHjmxas7a87QxAnX9ljfxcr+Mzs29ykpi1O8iJjoR/cm5o7dnUl89LRLW93dyWmVIip+Kp7pmlWqIvQ8Mga9Gslm3Efu3LX+K008HNK0ZUSgplnGMrZPGxgYsIKeXa/TA61jPu0w0+7xBx/cd3M+eZspD0wbDgWm+RXP13cODY/jWGKuGAb48jG+agNpilbqlKZoWDqDY2AyjtNUlupzYZlKpXgaxIVMNv0zd+/d+uxcaSVuZSPQ/IT13TN34QRvZW81n6HSDdMLUqmjh9tgd//Fi8OHEl3JL3Z2dh3MzGA7XU664llVWRz/QhLjNYmsmaWp/DjCjqIDdlaZTOZZ1/A+fGj7hjP5OLkQBMog0NSE9cSRszuswNhdpt31BRnazM3U9IuPHDrUuG+419eChqU+cvzqjp7u5P9KJpMPpqc51Zv9QntLkFQBEqZluVCw/7nhaP9i376+8YIouRQEyiLQtIQ1cPT8GjOw7vE8tyFtxBrb2MBXdh579FF99g0vC0nzB548ebNHT2l/aFmJj1BPBYyav9EFLaQ+jdPAVNL8/pZ13a8qiJLLOhAAjvrTRy/d0enbF+69d0tzHFhWR/vnk7Rple6mp+9uFFkRGF8LVj/08IUN8wGp2fIcPLh+4sCu9R+F3ucj0MLf4vaVVnChqYWmdaQS2jpY2vd0djh86Vqh7c3Yxm8dudTPxaW0lrn7yJEjZW0Tm7HdC2lT0xKW1xecgHE3FDWNcb7uDh6+r/96Y0prjlIO7ur7TOD5b3ayzt9ylY0Gl83qKFXZsCXrXdOlrV3djf2LBr556JOshLDmMWhPPXV6vav5O5jVxYLUhNl3iIbV8yiqpbI0bQcP85C2Xu0l3dczC0XUN4Pzb71339mFltOM+Q/0rzu5f2fvu1zH+QDOt3uZ0pbVRMRFouJK5qqeTkhVqyBdtdUmhGV5JI4cudrpd5kHiyp3tTU/8s6r+4rC2vCmaQmLWJO0Ep65INJK2tbpt75298U2HLuiLh3oX/95L+0/kHUyvwTieiUJHVEimVzy1UKeWMqv2pCoKEVFRNXT1aHawnBx80eAZj7TwcxdAc5Gi5fiaNnNT37nCk4xaV/X1IRF2B94YHt63qQVaCcfePX2K+07fMU9U7qtHev+xE/7r3cc70O+6w1gxuV0dHZiusgvJS/O7IskRXLs6KCxqj+B26t9a3uUREWi4plbQlTFYzXvu+7tB3EIUGel/L6e3TNw5NS8zYAqldss4YvzBC9C7559drAja3qvDoyg6pwCP+KBZaVOPPjazS1vMLpQKE9fuPnawDB+EqehPwzWuAuSl8LPg90WVxhJJPWQCUmPBAWTBEz1TFUGpqO3wYYvIPgr2az35a2b1/50V6f1e1NTlVcvEzB0xRekj67usu5FmS2/crvQcaol/zeeObfTSOj91dIq28PxiaOHDx9quy8LtQxhcZBqIS0Dhkl2l/3yA4e2j1Qb2JUUD1Iyz1waOQib0vsxKXsAFvH3wMB0JySwtZC+DBPTN5BOCEnhrI1BuKe9l6tIzsVCiD6E0DOabrwI2elZ09aP7N3aNxjheXvK+a1OENa0EFYEyYL9rz072Ju03ZpNQKj7Xd899cKhNrA9LASvZTY/s9GcHoK0XsrakLS8UklLxyl+/rj+/Qfu2367sJNyTS7SuZfneO7ffweBGScu3NwAqWgrTvTc5jjBZmw87tMCfRXYKQWOgula4OiBOQUZ7DZuhrAGdQXxV0zPuCaGnkv3VPGHOpPw7+QPR62OM5HhdNddGOeX2kmCbSnC4mDlSStVTFr4eLljdHV+702vWz9R66Cu5HS5h5hmHvz3QiOxwJTRo2BGgY06dm7OVhewYGAY6s75oD+ZDs4JPY9JyqSCQ7ABqftd5VFM3/j2Ja4mtsWpJQSq6ZXu5UZTKeJnsHpohiYPRqBn04nkS2+CQWW59BK2dAjwS0Y4IHDz2ERWG8Gnwm7iK9W3sFmbvrqGPzw6gW8eTmvTM07XmTPX28KYd7EQ3rjnvv1QFHbPt3zT9DcMPHd+13zzN1s+/hC2rKOo7NjeQdsxT5LEWrYjbdLw05eHtwWe9jl0542u62HZHZIVpalY/yIlP5X3MHYddLLZfy4fmYiBhNuB509vw+rG3tKY+kOwGHLi7W/cS91jS7v4s9TSnZHGLx8CICH9lXNDX+zpWfXuycnaBV2e3e567nAm4973qv0bzy1fD5qr5oEB7KXt0u7B3Loh7yhWVfypbOalh9+wr6U3mbfklLC5Hi1pDRE4ef7Wj+EEiZ+amqpvJT2bzWjJRLIPR3n9riA5i4DZg720DSIrlsrvHXSZ9p7ZGlrzSgirNcetqVp9/vz5FJTqj6JRejTdq6eBMzNpHP9s//QrF4bvrydfO6f1JrCX1mvcXlo98Kembjotr3wXwmrnp36J+pYNeh5JdqRem83O77gxkpxtW3bgOZ/g1HKJmt3U1Rw+3D+zrc89aunagnWzpq6PdxujLz388L4F78tdbtCEsJZ7BFq8/sHBoMPX/I9hyrGgnuDUUZzrnnz7yQu3HlxQQW2Ued++fZmJ1e5LoPB5k5ZpWCPXz+08du+99zrtAI0QVjuM4jL2YcIZeh+2+9wF49MFtYJSlgmHE0g/JlLWLJQPg7RmhtyXsJ18eja0tivsXhj6xy9ve/mRR5TRcG2ZmjyViN9NPkDN3Dz1FW5z9XM4i+s1ME1YcFNpUIrVLHzJzHnwjl0bn1twgW1UwPHjxxPXpztejR0HFTc+F3YXRwxdfdM9W08D0zrs4wtLaM5rkbCac1xaolWOvurhZIPIih0OdVm2haNTfqUlAFjCRnJP4HBn+iUqz6tVa2nGpTe/etsP2o2s2G8hrGqjL/FlEQC5GHghfplSUSMdvwaEA/9+4vjpa3c2stx2KIsfUek2dr+EuXNF2xEjSJx98w/tbFt7NiGsdniSl6EPp84O3W/Z1oPzXRms1GRKWdCJdeCIlJ+vlGYlh997r+70+EPH8NHJEtLCauCph+7bmj81ox1xEsJqx1Fdij4Zxi9AT2KSYBrtslgxhOD2gWOyz7AstFzx6zFHj1mGobYUYAgC9cHge3ddK5uhjQKFsNpoMJeqK6+8cm0X6noXiWUxHA8WxAdWNyQM45HFKL8dyiRpueM7jllmMGpnjO+1w9fNaxmXxiogaqlR0jQdAkeOBPjczrnOiQ6jw88ESSOA6KT7iQzOHEvavu1pZsLQg4QPP/DdZG9Xx/vWrOr+mfR03SvtNffdxleAQIgvTzjBT0w409Mpu2faufZy+vDhw5WPMa25dEnYqggIYbXqyNXY7i/jCyvdfmaVb5hdVsLp9LJGp43j1/1A7/RdvdMwPRzEboRnLVHe9vEvL3eXBOB4ZMta22H+TiqV2LJQ26u5u6Bju44Z3J7O/Lvp6cwPmBanOwQ4uNHRTWMK21bSvh1Mm642nTWCtKkH07rnTE72aOO0XZq7bIltVQSEsFp15HLthg5J/+aJE12m3tVjOPYq1/dW4cTjHnwMYhXOce8xDd3y/PJW6OpMdsTRVy4iK/rKMR/jwvz825VIHFzT3fkx13UW/dnhRy3GJyeeHEs7n1XNibUPFvY6vtGDw5vV9w0Vofn81qGhZfDhi3HX8SfQ/3HPMse9CWcCX0gel2OIFJIt+2fRH7qWRaYJG85NxldGzV4tGayFSLQ24+q9ULyu9gJfMU5ELTn6wUISTl03NHz1KzyiJLqmX657OLLdSJgoXTO7cBxyN172blier4YCvBsFdSNXV2dC35tKJrbzfPfFdjwvC/qs9MSMxxNRsSqmT6LhUDQHE+jUBE7UnATXTuLsrRn01K2l/x6+qItiR3TNG8V59KNB0DGSfNXGUXwJY2Gm+osNhpSvEBDCasIHgVLTt75/aQ0MnXpBNb2QgNYEntfr4wu/nBYpKQLtxtdwAh0SBX3VDe7nM/Ha5vf1Fb/CURS2bCTAWWuxR229qRsbQQQbUed61LfW14JVKKsTJ5sk8WUcHbtlNANyTOhgcmAGKH7p3m1FWpqtuZCu+LByVdKHVMjpKEQrBwIW9tnpXOIH+QTDSH/D9f0bmCLewDn1I4HmwtAypPDZ/oe9oXKf/aMPsWxSs/RR13FHrURiZE1gDR86tKHEdCDMKX+XCwEhrOVCvqBeHNaW6ui11/mWDtLQ1kEiWodXE4rwYgepAPssTPCMOjIdAk94TZ8pMZjch8HjDorGFUTUAwlkh64be0A9/ZCatiDZWtOyE7ClQmIdJICJFYhA+TRV4Fo5/QIHiUvrTEbkVRCxiJfsSBbfYk87OTExXxdazY5yUgiRKfpHQ1YSkONmAZY+gV4NIeVFfCXoLNA5h/Plb5LzWAyzF+IVXdNnvO/6GcsyhjC1vmWZ7s2pO3fdOqzriy9asnJxZREoerDLppDAhiIAEtCfO3F5rW0a6z1PX4/nf53nG5RqqrpieSnULEVh8cx4E7ugH78H8tG9eP/24oVezY+pkpA8b/abhPF8le75BqdsXUtaFeaTlTI2IByEoU1l8oq1mkokcZHElIRoWmpejMMCMyCvQXyy7JjjuUcgOl4tLCzCMpTHgFpcgkViX/dH/ax2Szf8m2Yqc/MN+1r7BM/C/rfCtRDWEozSkbMjq7NTY5t13dqE6dhG3wsSqlp+C9DDi0ifLrqmT1f6BgUaPjiHN0lJAGAfvpWcI4XjiHIMF6ocO/EjmMa9HeelQ1LT1PRpoce/sJwOTCQtc+kfGQp6Uxl+9JWtmL+jNEaJ0gKBgbsygR58B4sHfwV5aliVWg3vCHv6ymHcdG868IzrVsK6pnd71+/dsmXxbD3m3/W2ybn0T1/bQFe5I8euX+9ybuqbXMPbDA7ZCKV4uMOecyz+9OfmWvj9x9zEw6JW+JuOX298WhE6qtwLEV3TL1tb/AWj7sqwfqaro/sdmcyM+vBp2XzzDEzaBiQsNH+e+eeTjQ+ohwqnG0BYhfVzNYKrkOmpyauYYH8KvD8G6RPBszrC6Jq+ystl0ghzXEZjR5+O4+iZwTh+eG7Yqa5rq/3hGzzTSkXKn4YgIITVABjBP+ZzP7i8ydasrZCetuCHvIvFRs92SEdlpnCYE2LOQi12OA7RNf1yjrphHIyE9yOXPnfNMDg70DpdTf8DWDKs5rRvMVwChAWrUgh21HzllD0NrigqlxKVC7bKQuOOWeGiuI7OTkhb6T8C/Xw3xkel9cXxj6eIxiY3Hhx3X9dHsWJwDaa3l1+zd9Mt/F4tUk/ijWnP+/DBb8++LWqvnh0c7NDGta0pO7kl6zpb8AJzEUr91kYEFdeBRCt69Nm4+AsSl6jwjVGckY6VwPwUpLhLURx9xliWvxFHi/w+zB0SWCnLsVpxnoXesSI2ngp4zmRJXPgf/0IleGH51R6uwjeX5MR76qtITh7+8N9Cp4GF7Sm8Zl1s35pVXVomm/5c1vG+Wm284njHJeJq44/FjixUAld8w7uijW6+xo3MhW2S6+oIVHumqpewglJ87+LFtcFUcqur+1vxwPcZJqYPMOyhXw6GKI4+4/GwQpjCBhe+6XDIpFb06PM+np5hhS5eXzw9bLJ2pBLGv4Fe36BU4kA6IQGw8MUY6MJywVeqDs54Z69zrWdY7jI3G1ZtUiSV6zzDI3IqLLew/wu9jspl+yywrA1pEed5QceXPT3jBb/DLrA5ua5UHZ/4eMTbFx+fwvE3DJO8fANrjlctL7giJhRx9MrfR89R+VgJ1Y6currONuwd0FNsxwtV02mPlWGLy1TxlPHf6Hh8PH9xesvw9yRM+5PIRT2ZIgVKKZxWUY/PT8aTFPji0i3m4Ed1hDWV/7uY9bNGtiGqAyorJRWSqCgdkrQiR5KddrwPlsq8xfhG6efvx8dvtiQczDdmmPaldDBxSVYeZ3GJXxUMWzxq5d4fPz7Ym7X1HTAL2A7NqtJHEQ3qtCPjw3LoxB/v+OMZ5VVzR5aHWRuErYA+y4uu6fM+Xl9J/lh7bFvbY+vmv0bWos9tsXAWSLIiaSnyApHxJz6SbFSFuXTw8i86r5vVRW1m+6IHmUREAuI0lcREP5q2ztWPrO9/YK54xsXHI56+cePvj3qBfimZNS+J5FWMcrjptThsRd4dPX9+DcwEd5iQphwozfkCwJKaLv9ewHYKeicfSudwShcnJDBBOD3MTwGRO0cqLIj73jQTaejDBYaPHTBgJ/i5+HyYijd95sFhRzkzB7yL2IrCtGwezj9nOQVTUlfPwiicifnu5J0qHHd8mXHIG6ZD7JQqIk9kJK6QwAokMWRUhMaSeJ0vcfaiXNhs7PyuwpYV51Vh+EM/Pu2M9GckpyiOuZm2Wvtom+Y4me8xPbvIIujzPu6Wbvyt1ejL3U7Sv/v754ZHsORwaX3KGdwiJhO5pzY+Mivk/urVq52jTnIXlEc78LKu8qAMx/G8kHhyOicosz0ovM3IrIDKb15HSvDoOoqv+hMLYCOWI8ash0vmufryZVcqLz4u8fym3ov1xT/EVp4UDUTn4/iS0xW+sZTMojASmLqGp64iH4FRXJQ2TKj+lv7JVRTVxwQkm9APyaboGnGMzSVR6VR87ipsVT645ovOzi5tamb6zzB1/nqzjz+s9YetwLioZW5C8jq08K9+1IxS8yQsfF6ap1WL2BK8VOaJc6NbPcPrx7wJ++hmHQUPvOaQgMJ3ETtVlERDP0wVsQ19uPgcLQyt/Dc+p4jlL6k/1xa2qVyh5ApEzEoErm/DsPOTXV3de6anq36roFyRdYWVbVSshHJEMt98saIXfIu9koplYZL6m/hUz7kS/Jt0/PE8+Jj6X/Y6k+fv2tA1BKIvB/OC8WnGAmp5dpqx3XW36fjgYK/upXbhFd+BrRlqn16MfkrspkoC4hnirYjbUVWzs4rHx8uL3cerjwt0TA4RcBcsuX8Rn97q54okVsCKJJ9YkSvy1gJR4aOtnAr6OJP+L13d+BKBKMEzHhAfgDh6yzD+vqHjTDDvYpAxLqwEfVdbE9bpIEi6V27tdLP+LnzPrWS/XrRTnz5d4e79+LNY7r4kP+Z7Jv7z1LyPL0B4Tb+ci9cXLy+eJ54e8Rw//rqqcUR+HOrgYVprJbBl5E2w63oI64J7k8mUDZLGhmAXs19ucVkxP8gKQu4ptCxbMy2TW3KAGI4u1P207ztH3CDx/7bL+Cdse8h1Zy5ev7Dp8uHD7blJuy0J69TV8XW6l92Dl3cbLG6g98idbhDgdANcY1ZY9o2N4mpNr96GRf1Da3Wui0RW69F1bWslvp81LD2xDTOGu9DhQzBc7AcYfYlkAqo6A6ozqHNBYJTESGitTGShsp0qQSxT4AcoPJQw0LBlEPhBFakHDjoLvY+XgVIyg7WK77tG8n9pvpHXBbXL+OMBd7FN6KLu+uf27esbX9RHdIkLbxvCGhgYsDb3v2a7obt7YHakpKmYiqgE2ioqJbzIOszXcSov/DAzRRNehyJKvPx4+igv/ZLKEaCkoZxUFMYXE1I8f7Xyq/UHp9CkAlfbCF3NdlhS7IQguA0N2wiJYy1ktC5IISb1Okr5jSYruy2SGlYkIkKLSC3yy/WrUWGzSnjaTUX/QEhYQuNewLCdwBFKRkpOuAfr4sBnwwfDg6B0MHagORhBHNqHw5WxTwYav6lAt/42MBLfrYZXHO9w3Ftr/B0Hp0pY+tkD29ddAz5ln8NGjddSlNPyhHV8aKjbzAS7Dd3egRcvgRHJWyrHASw9Pyp+vlSxEluH0jWAGQF9VVZMpxHVRZ/xSKQU4PR5Xy0+/sLQZCFS9DN/XKtSeh5WrL2x+sMyZv+W67+vwz5eC7oDx12rm9pakNg639B68XL3Qh+2Bm94DySxHhg0daBHSQhiCbyyyMS9SDi8RhEHyYP1qD9qak0S4VGn5VYrSTRKEkKHWYYiHuQmCYb/YKYLqS+3H5LYckxJmz6qhSYJ5yNgzgtuclESpncBfN8Fj3lgJdCSGpHcGECoxrouMoHjzO+4evLLMB1VKxJV8Wyj8Q80Ix043jnTu32hlTdkh08Yn7UWcnio9Qs3pzZm0lN7LCOxIdIZxbuQ1+lAVFFxJB7aMeUIiPkiPRPjo2v6dPF4FVjHnxi/oQK0Az/bymf5uI7ayGLj6eM63nrbF5VNXzV7nv3HViQL3JAEaSV1z0iBNJIgJBCYkSKJYbdjEiSHw7a0BI5s6QBBbINUswMUsQ6E11UojZGccA9dcZDBdQY+TgyFTgkiEKYyIBvstAQzIRk8cBJ+A2j4gZFDFWAqjAp3V5IhQYYwwUJ57ByS0QINzMYK8FyrRxt3KNbXb2qG/UVNT5wDyCt6/A0boGbdqzPA4tD21SPquWihPy1FWHjQzYs3xnZkM95ePIZd8RccBx1xez/UPowp46I4+uVcLD9/8Plq0Gfy6Jp+uez5uqPyY+UtNN5DuVQc06drpv4bIDXsjtsMpdkOSC79QK4Xog3PzwF4IBNCBiIhpBSpoE8jioqWaM2KCRuOqwLXgIQItKIe0lCYD/lZjoqgGIo0+J++SsmMKA8eqQ21qHuUh2PfzQHN6vgG6vVK8GfmQhcbr3Yff+AEi3rtdCtNF8u/eIWD2ATXx4Mg0XH1Vr/hm7sDQw8PvyvTrriKWocEE0C6oM/kJRJHrAykgj6WGlq+JUifu6YfS6pu4/UVa6AgQcXKi78ApekhcWFBwMstEkTX9MvVHw+Lt2ex+4+Pg62CxgsHEwZbAdgWIJfA+ICkfDRYtyAwWWB7Ay8F8VT/KB0bOJ4Gx/CQfUKSwZGrJJs8iZHYgB0zMB+zk8hopQ8hEcEog2ERASIBAOL5fIrVIKLxXKtzKPZLgZUckvGf+/nH5HsK0+Uz3316zeAjj3D23Lwu90w0ZwNpiZ72UnvwfO/AXIFnXfLBxLOsHn6yiLqmr3oQ04LHX9hq6TFHI6txrlYWkHj98UT1lh8vryR/rIKq6aO204drdP8hRWF3itmLUw42QnW1CSTSA2IAIXkWOBYKLWw8wjVqNkEaFqjFwLQNJhWI4ZiFoiq6QX0SbsEo6HMoWVFCYprwjw6FP65BXCSoXJwiOwpnFK9A6yiWkQhRDwA9XAfpwLS/AqnqSKP7jwapquiznXFXMn6x8Yg/X/HySvLHKqiaPlZfvf0H6BloAM/v3tpzHkJwUx59Uxb4GE5Lfnt2ZGS16SX3+F5mq4llfegtwnaSR6J5EC8hPUV6IDaS6aDnoZ5DpYe6AtdgOr4pyhXLNPH0KKCo/DDP7N+S+mI6qHzbQr7AbdgW+iylWn0l5cf6E29ftfSN6L9lGl04x30tOtMHklmLhxpClW9BL4S1T+i2uNPRp+0FflD0AN9A9LHnmHGBBfJCE3QL9ALiguoJqiu+64gDzWGIIAlhzhaSDsMV/yjJi3BxyY9khP9BXBSzEMY/AFORGMmM1yyKZfmm+ZKuJf4uMHV1THEj+o+S864E7zYd/8Dliqp2MamvPbt9uw4dY/M4DnXTuMuXx/scK9iHLcbryzfKwvOJBSGNPl10Tb8WV0xYyMFymDdXXv46Kq+ueChJQI4WlSUqf8StOf5CNdXqr9afxe8/Gm6AoLAqGKyCGLSG350ACFzKM2FvaeOseEhFOsjItdQ2S6wYYmkOdl2+CfLBvmpIV55vYY2Qn6uAxAWC40zbhxSmWArcQj0TSIiSU37mx0kgVesgLereOSz8E5EWJa6Qzyh1hZEcO7xY4Ct9WLfNvwa+5xA2h6uGP6vMPxMsZ8WNf0Gf+cOCw9usq51a5+kNG9Sn1IjJsjoO0LI7EpVra/vxhPdFs7JyjYriohlbTAKGxO1C6oJEljseOLqmTxfPX66OucJK66OUNzuDjK7p05UIbGwX25I/vrj4BYrnD0uZ/Rtvfzz9fPsPIkgkbL0DZNMFRVEHFEY2ZCBTcwMLdfCsCCVN4SwpE9YG+ARNgD24IDHYSYB1yNCYDkLRFoC8oOUG40AKQx5IYyAmlQ6SF7dDoSof0hbJiApzqLs43aPc5UG+AvVQ/4T7nGQFQiJ5kdbAkmgH2Sz0FaWB4gLrad22v4nmuvPt/yzCc1+V4t0e4z93r8PYwDCvNANxLSthkai0jmCf5+jq6y6Y4SkjTfoKprgWufj9Dg3AozBmiK7pl3H8WDH3u0YfLY6u6c/HVS2vSvsxoygyTF2q/qNenEyjJ5NJPYGPRidME1M1/JYqwyoNq32Ihu4J0z5M+WA2DoqwEI9wfmEaEhQJzPNsKNOh0jJwrfRVJqbnNOrC6IGwQFzgHiKrpCuq2kE+FizrMXWE7IWCEKemg7hSiimOQchNIC3EchqpHlBO95TshQThkwF5TL9k+Mm/MZLGzVo3AlQdLzagDle1vCYd/wU9/5Z5ZcyZPnNow/J8ZHZZCGtsbKw3rdn7nIzTx42o0WfP1cPKuYJ6XPFs5q7p8zmKx5v8cdcxDeMPOR1fj+gh4X10TV/dukiC+nJPeLy8eH1hrtm/UVvpKxcrP2oL/dlcs1eQ9PCeo73wGcp+R2Xyvlp74vH19B9EkoA2CYKUlcQqJCQj6vkoyBjh/IurcJiy4Zxy2FMptRBO7sK3kClR0UYUZAX+wMqfC1ICiYHMYBsKSQsSFKaAUEqZLoiK00ASFsgpN0UEUWE6yOkiiArE6NmUb91OWwAAEuNJREFUszCNxA0c/uBoF04W86YOarWQAYjGmHBBEIkUiXEqib025hNmInWknv6zKo77Sh3/RvcfSx5Xl4O4yr5Y7NxiuEEQFT4uvs8yrF5VvosX28LLS185vsiRHkc9YPiJtrCbJIzHyx3gJdfpl80flZWPR6qIxJghus7xjSqj4E9UNn2VvN76Csqq6XIR+48OYEeGlcAaXhLfQwxNQcgQEI9IErOOxBUuCuDLz9Arm5iyOTaYy7Jty8hAb2VCm43ZmwnwQTbgFpAWyA4SGEKhaMdgYNpngKAcpeMCAfFjYGE4yAqco3RZ0LorUqOkxVkf6AgzvFBPFbISSsOUD+WRrWijpcwbmI4Gomj4yxAIv4bPVU+q9sfxk/EP36UlfP49N3vNWr/m9CZdX/zzjDDofAoW3XHVr9NPHdB8p2+uORl/mjFLUktMbBTtkSJbpLCRxYyD5OpJps/4+DJuvq5IIgoLqfi3pLzcRuloM7QSzKImsBSWG80LVKkxkSvOkFHaCjL5QvrPN9rwvaSVtEg2ICmQCNRQkGjwnlOpNktMxdds+GxcRFrIyCmhTQMEUJjl4qwtzPbAOVC8o0DUZroGiMmBpEUfRBZ4DvRUJC4/1GOpij1ML9XU0PJdFxIZGsOpJkkOQ0YdFh5CPodKl0WfRqQkVUhTIEf1iN4GkdJU4Rx/xsJfHkpfMv4cd+IAUJb1+YdkfSU7NXp6+/bti7qquKiEdfVq0Gl2TO2DonYzAcUTCv0slCB8FuGia/q8j7iAPl30aNIPHVKq55w+00MvjFLo05WmV8H5P9XLzydVF/H0xbGl9UGfjm226B98po2u6fO+0f3H9M7SbT1h+FoS00ybSmm+5/RZHxzbwWvVHtSvNuLRR4BKl0vPtHRhWh1SESUsNBkH0qjvNiAx4MA1JDBc4yBmTPmwJArJCFM+dA1SE5XsmFIqRTzKUrZYkMio78IUkauFoW6Mcbin1GWrOR8nqOEUEUQFmuK3ZdEw6NFg92s9j3XLp0CIsAuS8VdPkcKhCZ9/KAc81x/c3NdzFjy6KHZc0YPNh7VhDg9jYnh4co9n2dvx1nLalys7Rimx2xLGigfEJBQ0Xr149FkBVb04BQiTlPAFbTiDxRGKM1pJf5AgarPKG0sQu413N07hkCANO5m0fSebtCwziW5DqMISHTRMJCDF23inYbmsauNCHq+Vn1ta5dErzKN8psP/RiIXVpAegKJQ30Y06AQSEXdAIpdL0wbTNsLpoSIeCwRJHZYBpTusIFAIlPC0iqL5AxoCcmLPQkkLdITRCc0dSFqQD1A51g4pLOXmhZCwDMO2BpH9q6ZtDoU4oKQIy5yEynFnv+mzw+0+/q3Sf5yT4aYs89zq1alLIK7wYeQANcCpgW5AOaqIARzxcudrXrMTz+cuFAxBI1Rw06eLKz3xsnDikt+Mmr9mWBlXrbySeJAlTt8MXJImXHRNv0zx2GpWZ3r0KKqzXHlRHH26+fQf+mkbg56ADjppUuihMJl7BEhGtmnj+4Phj1lEUAzjaQcgJkzcqPPmlI/yjdJV8Trf/+hbeYyP0uMS0zSVF8SEaSELxkhR6a7IC1IVHkNMBWEkCljxYQ7YXgWKrDCHw2ohJDDKSkr5Tst3TANBp7DdgkTFKSOpxYMtV2i3hXQoJjwbBo3L4oibAajdXmSbCl01PEvi6x3PetMvwfi3cv+xHpPRk8GZvo6Oq5y5FvZlvtfqQZ5v5igfH7iRdHqrn/H24McyEb6ejCUxkCwqEATi8JDNKtWRIxI6wrLj+aOyQgIqLT/KTZ+OLYnCFGHE60PdSgzIgVmcfrbt5evjYkB97VeNyv8plx/UYoChElhYgB7KtD3PAUWRpejIVNzNAjNzyDuYRqnrMF5dIx4CkTrlAJQRps2FhZIX5lqYwfFLOygTBeSmkUhDEgNvIC7MR5ML6JhozoCpn+858G1utbH4j7BRT0Z9VlZzbTyOKJCKeCjkqYbkFBJh+DXCPVcKuXKIFURlm8WBoZSFOBCYmk6i33ioT+Kw1CegEMspcFfe+M8+rRySNum/YUwm9I7TPT04NWOBDg/nwtz16xMbEp3mPswIOuI6G7wBSlynz1pQWZEIP0smIcEEWN3QsfJDn+nj9FFSPh73wilgdE2f+eOumo4pPqWI2kI/LKu4RVXLq7H/kJopRUFhnkj4joNT9KC/BlZgAIVD1I+cwASVUBgCIsF1KEQxJLpGPKHGP5LYrAs5ikREnmJ61KF4K5cG1+REVS6HC1JauGroYYcOrLWUEp6MSF0UpoZgK5hV2dgEzeNLYbMBnRQZEUPnOwGMT6GOp57Kg/0WTCMYjnsQHpDmlJFTR5IcNt/alvV1PdF5NsKcLSpGG03L6QcjnWDpeIXqgFYb//A9wGi1+fMPDeqY7nae6uvT530KKp+JebkhHJyX6Fqz33X83tCgRr1d6gXBH+XnFtEwDmEVMBfAtbK7UvHxVTb1gGLQokbFVBZMDtUJHmT+dsPxmqSRU2nkrxkWxhfbOfEVwLov4sIaonSRr1qZy6vy8xliPbn+qPjYHxSm6mJwdB357DfaVtJ/BMLeW0/ayVQSR6TA5AB7h8kwmFeRrFBUSFYkJk7GsM+F5SuiCQmFBEriCskHYcxfEM9ozBjBS/yaKD//rBzndjD3BHswAcmqwFdhOWGugCw5owwpEt9sxMlVGWQEK4GlcAOi1XAcL6eLICfdcMFmNDnH7xdO/YTCHTkxM2B6EiSPbuXmHrZO5eJy4Iu6lfo2Gu8orFfA+PM9UMjnHpBIx9v+/Q9Wm8nMfcMTE1d7u7vP4Ec6fzy1wqOGP3xI63JHjgT2/rsy/boTbMP0pe78dVUWS5wjK0VUjIqNN3kA62ZYeIcfxofXDFNFUZBTT4W6m71mWBlXrb4yWSoEYWh0jVIUdJEmzA6o18mRDN7dCplCEkK8IiP4WRAU9OO8j5wimZB3SAhKYlJEphLkJCaSEP7PEdxsfVG5UWFxP6qPPngTlvBED6IWLN8dTPmg8ocFPPRXWBdlFWqqCEmLlhAgLRtKdLaAkpQNfRUM6DUQGOUiTimNEaT7FvRVw/F6K91XG4/mHf9KPaovvJ36jzfSS1mpc6mUdhnvhZL4a0GjZsKBKK+n0+kt0AHvztCAsIzjeeAeUKVPF1l101cBWCICxcGmcPalUeHRnyguIsJYej79fFnpKxdjrKhu+spVK69Ke+OW6SXlh7Xk/8b7D5umJKY6nUiQAEmp5ZKoD5Ay8kTFzcAsJIrL+ZREYCWAaU4ubXRNP8wfpuSuGubHMwCJhSuGPCiYJIMw5GV6xkfY0Wd+WoPiBAlEhvnzNluw3SKZYTkQHIQ5J1RQDg7Lw/QQGUIdFp4wcC9KgQ/7KkxjucEHROVmc3ZaCFfEjMxUvlPvBZ0WhT1Q1zG06hQKyGPA9qEh4bPRJuO/0p//WvoPyXpa77BPr9L1mn64QiJRT0vlP3jg1oyn0/th1dnN6VOkQyh8wVRuPpLUH9GHi+sckD4vLaj43NSHLwfv8cKjbGxdgc97JUpFpIRbpovKYHTUltkpHYkyEqNYf1gWfZU+Vn+JiMZERS4qKyTAMv1hmwoItLT/aL6OL9cn8A4mknhDkR5CUuh43ExhAXjnIQVxRQ9UwnU1JM73meHISINzlY/1Ir3jwNQBtui5IpU3K2mFZbEUEhgJiHlZhkqI8rws7hPFxBHlZ5romu1CGRSv2HyQEQiLPkwefJcSk2o0mU+F8Z46KswbKd8qvRUWiq7BsuoYlF/q+Jd839p4/KNnFHhw+Fbc819r/y3dHO7qsk9D2lLPBvEq59SLXC6CYSCq1OTk5F48g+FxLyQSvvyzhFK8taaYL1ACiYdkkSOg/HVO4irmAySLlR8+yHy5wnaWysTF7YmnRxdyecMXFDcxx3KjNCUEGUtb2r4Iixwh5qebxEG58v2Hkh0ERqlLp5kClNLkngLSyF8XExrZi089SYbFm9DRg1FCbEKyoxQE8sqFkTOgTwrDVIPCP/k8qpRcGrxMEXmxnpwjUeXbhjpgA2bBNsp0HPQWOiwNOnddw5YcNIdSFyzTlUKehEbrLDxDNn7osjCXPw5FO22qgPfKHn/pf8XxxxetvSvYlX8BxBVKCdGDmPPDhz0W+Oijjxof//jHt+Hh2oko/qKqFx4l0BJQmQIwS3RNn/fxZXqGFbq4nQzimI9tKFs+S1S1KJ9XoQkEfUQwtKg98fSzefMMwmx5F28/IqK2RLjM2b54/gX0H0v6+IiDZSVgHJogfYWNzDMUpCtsUkKg4pKIUJAsnNTlkjNWzfBCPMOhi8JAiCSqPBmyMFVQ1OdctQwLywNZ5cPCpDl80D6IhjzBASQF0sUeREpSJCyE4ceSpJXbEO2612AHepaTSRn/YrtEAD3n8xV/ntv4+S96nyGRO9gccQZmEPiBK3bRi5kPHcG+v2T32n2+53bxNY8oQyWIB0SR9OmqxMeTh5lm/8azx8srEbCQNSqTpUTX+eagwCiPqiWeQAXO/olHV2tPaYUFjWCxsQJjt7MV564K6iOB2Xj1adNGa3PqDMFl4XwSSnAQCUIibqFPlwtTwbiOkoSR+JvLx3KYv9BXaSrlLyifSegQBNMFTAWhiIeFArRZnoX+8Y2EzKhbnuNlYO9wFpZXkwoH5Kmj/6qOFTz+0n8+Y4Y/2pVIcJqY35+YJ6wjEN33ZzL9kPY3hWjx6Sv+RcByLIQAZZYQJSn2C944FRF/QkvjQ31XZDcV04GVPOGl+WdJEhVGbaNPV3d7Va7ZP83U/1ACgzTjkg4gjUFvHhGWkrPAPnnBLNeFSEKKfAbzOu9yBAUdVj6cZURpZuU3XOUILioD93x2IEnxxFGc9c6M+M93cHSNZVzHquBQDeMn4x898wQ2us7pgGvAbyU8/z5e5EupVEqtJirCgp4KHxVI7sbrQIYKHyKF3+yvIvEEX8FsQNk9qXwgBpgQwNo7p9OKrukzfdzF08+WTmYrV35YF+tU8bEpYImInGtLVH+8PkzZ8iQcVpjrawXCLOHH5uo/9JmWjbXHJMQcNhVW8bOklbsumnJw7Q+cgtVK2mJxAUNNKKncp54KHuzAwnjCE01B1UIHA1A80ik/IkdIfTj6mE8MXh2sSKZhdHUd+IcDykwFLj4eMv7Fv+il75c8/xEmeHaojD+jZ4LgbsPVVvO5iutg4oSAFCCiAqVp/jrUKRU8mzVexsube05ff3tiD0Q1wkP/ojrYgeiaftiheHsjLKL4GrudTxYvb0H9h94bpzeAwCD4cAqJf5SmlBjFH5D8ChVC1Q8KyIkrjtgbE64y4lqtINJHel5Hq4q4ZdsYzsWBWaU+rkFWtFzQbiNNnWciNbT/qD4+Hitq/FdE/3mWzmvQU+W4hZZPenQuRHRNfylcvfVjpUqz0Tj6dNE1/fm4euufTx1z5am3/hr6z6lj9A9ElneKwPJ3IYEVEpqKys0YFeUhoDBP4TV/+bjVIkfqKuu8/ixC/+tqR73111V4DYnrrb+G8a+h1tkk9dY/m7MxV7XUzwdP3ApBgCYG6Co+L6/+kcB4X0g0ERFFzwXjojBc5q8ZhqOKtWEoROmLEwSWBIHowVySyqSS5kIABEYhisRFEov8SgRWGD6K9OMgq8IwBIkTBBYXASGsxcW3pUoHgfF5iIiLPv9x+03kuLxMqaqsUj1KJL4gsFgICGEtFrJtUG6OwDhtJHHhqLOl+dBAG0AnXRAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBAFBQBAQBAQBQUAQEAQEAUFAEBAEBIGVhMD/D0fV/fpMMM+gAAAAAElFTkSuQmCC"
    }
  };
  const NoticeBar = {
    // noticeBar
    noticeBar: {
      text: () => [],
      direction: "row",
      step: false,
      icon: "volume",
      mode: "",
      color: "#f9ae3d",
      bgColor: "#fdf6ec",
      speed: 80,
      fontSize: 14,
      duration: 2e3,
      disableTouch: true,
      url: "",
      linkType: "navigateTo"
    }
  };
  const Notify = {
    // notify组件
    notify: {
      top: 0,
      type: "primary",
      color: "#ffffff",
      bgColor: "",
      message: "",
      duration: 3e3,
      fontSize: 15,
      safeAreaInsetTop: false
    }
  };
  const NumberBox = {
    // 步进器组件
    numberBox: {
      name: "",
      value: 0,
      min: 1,
      max: Number.MAX_SAFE_INTEGER,
      step: 1,
      integer: false,
      disabled: false,
      disabledInput: false,
      asyncChange: false,
      inputWidth: 35,
      showMinus: true,
      showPlus: true,
      decimalLength: null,
      longPress: true,
      color: "#323233",
      buttonSize: 30,
      bgColor: "#EBECEE",
      cursorSpacing: 100,
      disableMinus: false,
      disablePlus: false,
      iconStyle: ""
    }
  };
  const NumberKeyboard = {
    // 数字键盘
    numberKeyboard: {
      mode: "number",
      dotDisabled: false,
      random: false
    }
  };
  const Overlay = {
    // overlay组件
    overlay: {
      show: false,
      zIndex: 10070,
      duration: 300,
      opacity: 0.5
    }
  };
  const Parse = {
    // parse
    parse: {
      copyLink: true,
      errorImg: "",
      lazyLoad: false,
      loadingImg: "",
      pauseVideo: true,
      previewImg: true,
      setTitle: true,
      showImgMenu: true
    }
  };
  const Picker = {
    // picker
    picker: {
      show: false,
      showToolbar: true,
      title: "",
      columns: () => [],
      loading: false,
      itemHeight: 44,
      cancelText: "取消",
      confirmText: "确定",
      cancelColor: "#909193",
      confirmColor: "#3c9cff",
      visibleItemCount: 5,
      keyName: "text",
      closeOnClickOverlay: false,
      defaultIndex: () => [],
      immediateChange: false
    }
  };
  const Popup = {
    // popup组件
    popup: {
      show: false,
      overlay: true,
      mode: "bottom",
      duration: 300,
      closeable: false,
      overlayStyle: () => {
      },
      closeOnClickOverlay: true,
      zIndex: 10075,
      safeAreaInsetBottom: true,
      safeAreaInsetTop: false,
      closeIconPos: "top-right",
      round: 0,
      zoom: true,
      bgColor: "",
      overlayOpacity: 0.5
    }
  };
  const Radio = {
    // radio组件
    radio: {
      name: "",
      shape: "",
      disabled: "",
      labelDisabled: "",
      activeColor: "",
      inactiveColor: "",
      iconSize: "",
      labelSize: "",
      label: "",
      labelColor: "",
      size: "",
      iconColor: "",
      placement: ""
    }
  };
  const RadioGroup = {
    // radio-group组件
    radioGroup: {
      value: "",
      disabled: false,
      shape: "circle",
      activeColor: "#2979ff",
      inactiveColor: "#c8c9cc",
      name: "",
      size: 18,
      placement: "row",
      label: "",
      labelColor: "#303133",
      labelSize: 14,
      labelDisabled: false,
      iconColor: "#ffffff",
      iconSize: 12,
      borderBottom: false,
      iconPlacement: "left"
    }
  };
  const Rate = {
    // rate组件
    rate: {
      value: 1,
      count: 5,
      disabled: false,
      size: 18,
      inactiveColor: "#b2b2b2",
      activeColor: "#FA3534",
      gutter: 4,
      minCount: 1,
      allowHalf: false,
      activeIcon: "star-fill",
      inactiveIcon: "star",
      touchable: true
    }
  };
  const ReadMore = {
    // readMore
    readMore: {
      showHeight: 400,
      toggle: false,
      closeText: "展开阅读全文",
      openText: "收起",
      color: "#2979ff",
      fontSize: 14,
      textIndent: "2em",
      name: ""
    }
  };
  const Row = {
    // row
    row: {
      gutter: 0,
      justify: "start",
      align: "center"
    }
  };
  const RowNotice = {
    // rowNotice
    rowNotice: {
      text: "",
      icon: "volume",
      mode: "",
      color: "#f9ae3d",
      bgColor: "#fdf6ec",
      fontSize: 14,
      speed: 80
    }
  };
  const ScrollList = {
    // scrollList
    scrollList: {
      indicatorWidth: 50,
      indicatorBarWidth: 20,
      indicator: true,
      indicatorColor: "#f2f2f2",
      indicatorActiveColor: "#3c9cff",
      indicatorStyle: ""
    }
  };
  const Search = {
    // search
    search: {
      shape: "round",
      bgColor: "#f2f2f2",
      placeholder: "请输入关键字",
      clearabled: true,
      focus: false,
      showAction: true,
      actionStyle: () => ({}),
      actionText: "搜索",
      inputAlign: "left",
      inputStyle: () => ({}),
      disabled: false,
      borderColor: "transparent",
      searchIconColor: "#909399",
      searchIconSize: 22,
      color: "#606266",
      placeholderColor: "#909399",
      searchIcon: "search",
      margin: "0",
      animation: false,
      value: "",
      maxlength: "-1",
      height: 32,
      label: null
    }
  };
  const Section = {
    // u-section组件
    section: {
      title: "",
      subTitle: "更多",
      right: true,
      fontSize: 15,
      bold: true,
      color: "#303133",
      subColor: "#909399",
      showLine: true,
      lineColor: "",
      arrow: true
    }
  };
  const Skeleton = {
    // skeleton
    skeleton: {
      loading: true,
      animate: true,
      rows: 0,
      rowsWidth: "100%",
      rowsHeight: 18,
      title: true,
      titleWidth: "50%",
      titleHeight: 18,
      avatar: false,
      avatarSize: 32,
      avatarShape: "circle"
    }
  };
  const Slider = {
    // slider组件
    slider: {
      value: 0,
      blockSize: 18,
      min: 0,
      max: 100,
      step: 1,
      activeColor: "#2979ff",
      inactiveColor: "#c0c4cc",
      blockColor: "#ffffff",
      showValue: false,
      disabled: false,
      blockStyle: () => {
      }
    }
  };
  const StatusBar = {
    // statusBar
    statusBar: {
      bgColor: "transparent"
    }
  };
  const Steps = {
    // steps组件
    steps: {
      direction: "row",
      current: 0,
      activeColor: "#3c9cff",
      inactiveColor: "#969799",
      activeIcon: "",
      inactiveIcon: "",
      dot: false
    }
  };
  const StepsItem = {
    // steps-item组件
    stepsItem: {
      title: "",
      desc: "",
      iconSize: 17,
      error: false
    }
  };
  const Sticky = {
    // sticky组件
    sticky: {
      offsetTop: 0,
      customNavHeight: 0,
      disabled: false,
      bgColor: "transparent",
      zIndex: "",
      index: ""
    }
  };
  const Subsection = {
    // subsection组件
    subsection: {
      list: [],
      current: 0,
      activeColor: "#3c9cff",
      inactiveColor: "#303133",
      mode: "button",
      fontSize: 12,
      bold: true,
      bgColor: "#eeeeef",
      keyName: "name"
    }
  };
  const SwipeAction = {
    // swipe-action组件
    swipeAction: {
      autoClose: true
    }
  };
  const SwipeActionItem = {
    // swipeActionItem 组件
    swipeActionItem: {
      show: false,
      name: "",
      disabled: false,
      threshold: 20,
      autoClose: true,
      options: [],
      duration: 300
    }
  };
  const Swiper = {
    // swiper 组件
    swiper: {
      list: () => [],
      indicator: false,
      indicatorActiveColor: "#FFFFFF",
      indicatorInactiveColor: "rgba(255, 255, 255, 0.35)",
      indicatorStyle: "",
      indicatorMode: "line",
      autoplay: true,
      current: 0,
      currentItemId: "",
      interval: 3e3,
      duration: 300,
      circular: false,
      previousMargin: 0,
      nextMargin: 0,
      acceleration: false,
      displayMultipleItems: 1,
      easingFunction: "default",
      keyName: "url",
      imgMode: "aspectFill",
      height: 130,
      bgColor: "#f3f4f6",
      radius: 4,
      loading: false,
      showTitle: false
    }
  };
  const SwipterIndicator = {
    // swiperIndicator 组件
    swiperIndicator: {
      length: 0,
      current: 0,
      indicatorActiveColor: "",
      indicatorInactiveColor: "",
      indicatorMode: "line"
    }
  };
  const Switch = {
    // switch
    switch: {
      loading: false,
      disabled: false,
      size: 25,
      activeColor: "#2979ff",
      inactiveColor: "#ffffff",
      value: false,
      activeValue: true,
      inactiveValue: false,
      asyncChange: false,
      space: 0
    }
  };
  const Tabbar = {
    // tabbar
    tabbar: {
      value: null,
      safeAreaInsetBottom: true,
      border: true,
      zIndex: 1,
      activeColor: "#1989fa",
      inactiveColor: "#7d7e80",
      fixed: true,
      placeholder: true
    }
  };
  const TabbarItem = {
    //
    tabbarItem: {
      name: null,
      icon: "",
      badge: null,
      dot: false,
      text: "",
      badgeStyle: "top: 6px;right:2px;"
    }
  };
  const Tabs = {
    //
    tabs: {
      duration: 300,
      list: () => [],
      lineColor: "#3c9cff",
      activeStyle: () => ({
        color: "#303133"
      }),
      inactiveStyle: () => ({
        color: "#606266"
      }),
      lineWidth: 20,
      lineHeight: 3,
      lineBgSize: "cover",
      itemStyle: () => ({
        height: "44px"
      }),
      scrollable: true,
      current: 0,
      keyName: "name"
    }
  };
  const Tag = {
    // tag 组件
    tag: {
      type: "primary",
      disabled: false,
      size: "medium",
      shape: "square",
      text: "",
      bgColor: "",
      color: "",
      borderColor: "",
      closeColor: "#C6C7CB",
      name: "",
      plainFill: false,
      plain: false,
      closable: false,
      show: true,
      icon: ""
    }
  };
  const Text = {
    // text 组件
    text: {
      type: "",
      show: true,
      text: "",
      prefixIcon: "",
      suffixIcon: "",
      mode: "",
      href: "",
      format: "",
      call: false,
      openType: "",
      bold: false,
      block: false,
      lines: "",
      color: "#303133",
      size: 15,
      iconStyle: () => ({
        fontSize: "15px"
      }),
      decoration: "none",
      margin: 0,
      lineHeight: "",
      align: "left",
      wordWrap: "normal"
    }
  };
  const Textarea = {
    // textarea 组件
    textarea: {
      value: "",
      placeholder: "",
      placeholderClass: "textarea-placeholder",
      placeholderStyle: "color: #c0c4cc",
      height: 70,
      confirmType: "done",
      disabled: false,
      count: false,
      focus: false,
      autoHeight: false,
      fixed: false,
      cursorSpacing: 0,
      cursor: "",
      showConfirmBar: true,
      selectionStart: -1,
      selectionEnd: -1,
      adjustPosition: true,
      disableDefaultPadding: false,
      holdKeyboard: false,
      maxlength: 140,
      border: "surround",
      formatter: null
    }
  };
  const Toast = {
    // toast组件
    toast: {
      zIndex: 10090,
      loading: false,
      text: "",
      icon: "",
      type: "",
      loadingMode: "",
      show: "",
      overlay: false,
      position: "center",
      params: () => {
      },
      duration: 2e3,
      isTab: false,
      url: "",
      callback: null,
      back: false
    }
  };
  const Toolbar = {
    // toolbar 组件
    toolbar: {
      show: true,
      cancelText: "取消",
      confirmText: "确认",
      cancelColor: "#909193",
      confirmColor: "#3c9cff",
      title: ""
    }
  };
  const Tooltip = {
    // tooltip 组件
    tooltip: {
      text: "",
      copyText: "",
      size: 14,
      color: "#606266",
      bgColor: "transparent",
      direction: "top",
      zIndex: 10071,
      showCopy: true,
      buttons: () => [],
      overlay: true,
      showToast: true
    }
  };
  const Transition = {
    // transition动画组件的props
    transition: {
      show: false,
      mode: "fade",
      duration: "300",
      timingFunction: "ease-out"
    }
  };
  const Upload = {
    // upload组件
    upload: {
      accept: "image",
      capture: () => ["album", "camera"],
      compressed: true,
      camera: "back",
      maxDuration: 60,
      uploadIcon: "camera-fill",
      uploadIconColor: "#D3D4D6",
      useBeforeRead: false,
      previewFullImage: true,
      maxCount: 52,
      disabled: false,
      imageMode: "aspectFill",
      name: "",
      sizeType: () => ["original", "compressed"],
      multiple: false,
      deletable: true,
      maxSize: Number.MAX_VALUE,
      fileList: () => [],
      uploadText: "",
      width: 80,
      height: 80,
      previewImage: true
    }
  };
  const drawer = {
    // 抽屉组件
    drawer: {
      // 是否显示 
      show: false,
      // 点击遮罩是否关闭
      mask: true,
      // // 是否显示关闭按钮
      // closeBtn:true,
      // 抽屉宽度
      width: "40%",
      // 抽屉位置
      placement: "left",
      // 权重
      zIndex: 100
    }
  };
  const props$g = {
    ...ActionSheet,
    ...Album,
    ...Alert,
    ...Avatar,
    ...AvatarGroup,
    ...Backtop,
    ...Badge,
    ...Button,
    ...Calendar,
    ...CarKeyboard,
    ...Cell,
    ...CellGroup,
    ...Checkbox,
    ...CheckboxGroup,
    ...CircleProgress,
    ...Code,
    ...CodeInput,
    ...Col,
    ...Collapse,
    ...CollapseItem,
    ...ColumnNotice,
    ...CountDown,
    ...CountTo,
    ...DatetimePicker,
    ...Divider,
    ...Empty,
    ...Form,
    ...GormItem,
    ...Gap,
    ...Grid,
    ...GridItem,
    ...Icon,
    ...Image,
    ...IndexAnchor,
    ...IndexList,
    ...Input,
    ...Keyboard,
    ...Line,
    ...LineProgress,
    ...Link,
    ...List,
    ...ListItem,
    ...LoadingIcon,
    ...LoadingPage,
    ...Loadmore,
    ...Modal,
    ...Navbar,
    ...NoNetwork,
    ...NoticeBar,
    ...Notify,
    ...NumberBox,
    ...NumberKeyboard,
    ...Overlay,
    ...Parse,
    ...Picker,
    ...Popup,
    ...Radio,
    ...RadioGroup,
    ...Rate,
    ...ReadMore,
    ...Row,
    ...RowNotice,
    ...ScrollList,
    ...Search,
    ...Section,
    ...Skeleton,
    ...Slider,
    ...StatusBar,
    ...Steps,
    ...StepsItem,
    ...Sticky,
    ...Subsection,
    ...SwipeAction,
    ...SwipeActionItem,
    ...Swiper,
    ...SwipterIndicator,
    ...Switch,
    ...Tabbar,
    ...TabbarItem,
    ...Tabs,
    ...Tag,
    ...Text,
    ...Textarea,
    ...Toast,
    ...Toolbar,
    ...Tooltip,
    ...Transition,
    ...Upload,
    ...drawer
  };
  const props$f = {
    props: {
      // 图标类名
      name: {
        type: String,
        default: props$g.icon.name
      },
      // 图标颜色，可接受主题色
      color: {
        type: String,
        default: props$g.icon.color
      },
      // 字体大小，单位px
      size: {
        type: [String, Number],
        default: props$g.icon.size
      },
      // 是否显示粗体
      bold: {
        type: Boolean,
        default: props$g.icon.bold
      },
      // 点击图标的时候传递事件出去的index（用于区分点击了哪一个）
      index: {
        type: [String, Number],
        default: props$g.icon.index
      },
      // 触摸图标时的类名
      hoverClass: {
        type: String,
        default: props$g.icon.hoverClass
      },
      // 自定义扩展前缀，方便用户扩展自己的图标库
      customPrefix: {
        type: String,
        default: props$g.icon.customPrefix
      },
      // 图标右边或者下面的文字
      label: {
        type: [String, Number],
        default: props$g.icon.label
      },
      // label的位置，只能右边或者下边
      labelPos: {
        type: String,
        default: props$g.icon.labelPos
      },
      // label的大小
      labelSize: {
        type: [String, Number],
        default: props$g.icon.labelSize
      },
      // label的颜色
      labelColor: {
        type: String,
        default: props$g.icon.labelColor
      },
      // label与图标的距离
      space: {
        type: [String, Number],
        default: props$g.icon.space
      },
      // 图片的mode
      imgMode: {
        type: String,
        default: props$g.icon.imgMode
      },
      // 用于显示图片小图标时，图片的宽度
      width: {
        type: [String, Number],
        default: props$g.icon.width
      },
      // 用于显示图片小图标时，图片的高度
      height: {
        type: [String, Number],
        default: props$g.icon.height
      },
      // 用于解决某些情况下，让图标垂直居中的用途
      top: {
        type: [String, Number],
        default: props$g.icon.top
      },
      // 是否阻止事件传播
      stop: {
        type: Boolean,
        default: props$g.icon.stop
      }
    }
  };
  const mpMixin = {};
  const mixin = {
    // 定义每个组件都可能需要用到的外部样式以及类名
    props: {
      // 每个组件都有的父组件传递的样式，可以为字符串或者对象形式
      customStyle: {
        type: [Object, String],
        default: () => ({})
      },
      customClass: {
        type: String,
        default: ""
      },
      // 跳转的页面路径
      url: {
        type: String,
        default: ""
      },
      // 页面跳转的类型
      linkType: {
        type: String,
        default: "navigateTo"
      }
    },
    data() {
      return {};
    },
    onLoad() {
      this.$u.getRect = this.$uGetRect;
    },
    created() {
      this.$u.getRect = this.$uGetRect;
    },
    computed: {
      // 在2.x版本中，将会把$u挂载到uni对象下，导致在模板中无法使用uni.$u.xxx形式
      // 所以这里通过computed计算属性将其附加到this.$u上，就可以在模板或者js中使用uni.$u.xxx
      // 只在nvue环境通过此方式引入完整的$u，其他平台会出现性能问题，非nvue则按需引入（主要原因是props过大）
      $u() {
        return uni.$u.deepMerge(uni.$u, {
          props: void 0,
          http: void 0,
          mixin: void 0
        });
      },
      /**
       * 生成bem规则类名
       * 由于微信小程序，H5，nvue之间绑定class的差异，无法通过:class="[bem()]"的形式进行同用
       * 故采用如下折中做法，最后返回的是数组（一般平台）或字符串（支付宝和字节跳动平台），类似['a', 'b', 'c']或'a b c'的形式
       * @param {String} name 组件名称
       * @param {Array} fixed 一直会存在的类名
       * @param {Array} change 会根据变量值为true或者false而出现或者隐藏的类名
       * @returns {Array|string}
       */
      bem() {
        return function(name, fixed, change) {
          const prefix = `u-${name}--`;
          const classes = {};
          if (fixed) {
            fixed.map((item) => {
              classes[prefix + this[item]] = true;
            });
          }
          if (change) {
            change.map((item) => {
              this[item] ? classes[prefix + item] = this[item] : delete classes[prefix + item];
            });
          }
          return Object.keys(classes);
        };
      }
    },
    methods: {
      // 跳转某一个页面
      openPage(urlKey = "url") {
        const url2 = this[urlKey];
        if (url2) {
          this.$u.route({ type: this.linkType, url: url2 });
        }
      },
      // 查询节点信息
      // 目前此方法在支付宝小程序中无法获取组件跟接点的尺寸，为支付宝的bug(2020-07-21)
      // 解决办法为在组件根部再套一个没有任何作用的view元素
      $uGetRect(selector, all) {
        return new Promise((resolve) => {
          uni.createSelectorQuery().in(this)[all ? "selectAll" : "select"](selector).boundingClientRect((rect) => {
            if (all && Array.isArray(rect) && rect.length) {
              resolve(rect);
            }
            if (!all && rect) {
              resolve(rect);
            }
          }).exec();
        });
      },
      getParentData(parentName = "") {
        if (!this.parent)
          this.parent = {};
        this.parent = uni.$u.$parent.call(this, parentName);
        if (this.parent.children) {
          this.parent.children.indexOf(this) === -1 && this.parent.children.push(this);
        }
        if (this.parent && this.parentData) {
          Object.keys(this.parentData).map((key) => {
            this.parentData[key] = this.parent[key];
          });
        }
      },
      // 阻止事件冒泡
      preventEvent(e) {
        e && typeof e.stopPropagation === "function" && e.stopPropagation();
      },
      // 空操作
      noop(e) {
        this.preventEvent(e);
      }
    },
    onReachBottom() {
      uni.$emit("uOnReachBottom");
    },
    beforeDestroy() {
      if (this.parent && uni.$u.test.array(this.parent.children)) {
        const childrenList = this.parent.children;
        childrenList.map((child, index2) => {
          if (child === this) {
            childrenList.splice(index2, 1);
          }
        });
      }
    }
  };
  const _export_sfc = (sfc, props2) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props2) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$v = {
    name: "u-icon",
    data() {
      return {};
    },
    emits: ["click"],
    mixins: [mpMixin, mixin, props$f],
    computed: {
      uClasses() {
        let classes = [];
        classes.push(this.customPrefix + "-" + this.name);
        if (this.color && uni.$u.config.type.includes(this.color))
          classes.push("u-icon__icon--" + this.color);
        return classes;
      },
      iconStyle() {
        let style = {};
        style = {
          fontSize: uni.$u.addUnit(this.size),
          lineHeight: uni.$u.addUnit(this.size),
          fontWeight: this.bold ? "bold" : "normal",
          // 某些特殊情况需要设置一个到顶部的距离，才能更好的垂直居中
          top: uni.$u.addUnit(this.top)
        };
        if (this.color && !uni.$u.config.type.includes(this.color))
          style.color = this.color;
        return style;
      },
      // 判断传入的name属性，是否图片路径，只要带有"/"均认为是图片形式
      isImg() {
        return this.name.indexOf("/") !== -1;
      },
      imgStyle() {
        let style = {};
        style.width = this.width ? uni.$u.addUnit(this.width) : uni.$u.addUnit(this.size);
        style.height = this.height ? uni.$u.addUnit(this.height) : uni.$u.addUnit(this.size);
        return style;
      },
      // 通过图标名，查找对应的图标
      icon() {
        return icons["uicon-" + this.name] || this.name;
      }
    },
    methods: {
      clickHandler(e) {
        this.$emit("click", this.index);
        this.stop && this.preventEvent(e);
      }
    }
  };
  function _sfc_render$h(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["u-icon", ["u-icon--" + _ctx.labelPos]]),
        onClick: _cache[0] || (_cache[0] = (...args) => $options.clickHandler && $options.clickHandler(...args))
      },
      [
        $options.isImg ? (vue.openBlock(), vue.createElementBlock("image", {
          key: 0,
          class: "u-icon__img",
          src: _ctx.name,
          mode: _ctx.imgMode,
          style: vue.normalizeStyle([$options.imgStyle, _ctx.$u.addStyle(_ctx.customStyle)])
        }, null, 12, ["src", "mode"])) : (vue.openBlock(), vue.createElementBlock("text", {
          key: 1,
          class: vue.normalizeClass(["u-icon__icon", $options.uClasses]),
          style: vue.normalizeStyle([$options.iconStyle, _ctx.$u.addStyle(_ctx.customStyle)]),
          "hover-class": _ctx.hoverClass
        }, vue.toDisplayString($options.icon), 15, ["hover-class"])),
        vue.createCommentVNode(' 这里进行空字符串判断，如果仅仅是v-if="label"，可能会出现传递0的时候，结果也无法显示 '),
        _ctx.label !== "" ? (vue.openBlock(), vue.createElementBlock(
          "text",
          {
            key: 2,
            class: "u-icon__label",
            style: vue.normalizeStyle({
              color: _ctx.labelColor,
              fontSize: _ctx.$u.addUnit(_ctx.labelSize),
              marginLeft: _ctx.labelPos == "right" ? _ctx.$u.addUnit(_ctx.space) : 0,
              marginTop: _ctx.labelPos == "bottom" ? _ctx.$u.addUnit(_ctx.space) : 0,
              marginRight: _ctx.labelPos == "left" ? _ctx.$u.addUnit(_ctx.space) : 0,
              marginBottom: _ctx.labelPos == "top" ? _ctx.$u.addUnit(_ctx.space) : 0
            })
          },
          vue.toDisplayString(_ctx.label),
          5
          /* TEXT, STYLE */
        )) : vue.createCommentVNode("v-if", true)
      ],
      2
      /* CLASS */
    );
  }
  const __easycom_0$8 = /* @__PURE__ */ _export_sfc(_sfc_main$v, [["render", _sfc_render$h], ["__scopeId", "data-v-ac70166d"], ["__file", "E:/Uni-App/urshop/uni_modules/uview-plus/components/u-icon/u-icon.vue"]]);
  const props$e = {
    props: {
      // 绑定的值
      modelValue: {
        type: [String, Number],
        default: props$g.input.value
      },
      // number-数字输入键盘，app-vue下可以输入浮点数，app-nvue和小程序平台下只能输入整数
      // idcard-身份证输入键盘，微信、支付宝、百度、QQ小程序
      // digit-带小数点的数字键盘，App的nvue页面、微信、支付宝、百度、头条、QQ小程序
      // text-文本输入键盘
      type: {
        type: String,
        default: props$g.input.type
      },
      // 如果 textarea 是在一个 position:fixed 的区域，需要显示指定属性 fixed 为 true，
      // 兼容性：微信小程序、百度小程序、字节跳动小程序、QQ小程序
      fixed: {
        type: Boolean,
        default: props$g.input.fixed
      },
      // 是否禁用输入框
      disabled: {
        type: Boolean,
        default: props$g.input.disabled
      },
      // 禁用状态时的背景色
      disabledColor: {
        type: String,
        default: props$g.input.disabledColor
      },
      // 是否显示清除控件
      clearable: {
        type: Boolean,
        default: props$g.input.clearable
      },
      // 是否密码类型
      password: {
        type: Boolean,
        default: props$g.input.password
      },
      // 最大输入长度，设置为 -1 的时候不限制最大长度
      maxlength: {
        type: [String, Number],
        default: props$g.input.maxlength
      },
      // 	输入框为空时的占位符
      placeholder: {
        type: String,
        default: props$g.input.placeholder
      },
      // 指定placeholder的样式类，注意页面或组件的style中写了scoped时，需要在类名前写/deep/
      placeholderClass: {
        type: String,
        default: props$g.input.placeholderClass
      },
      // 指定placeholder的样式
      placeholderStyle: {
        type: [String, Object],
        default: props$g.input.placeholderStyle
      },
      // 是否显示输入字数统计，只在 type ="text"或type ="textarea"时有效
      showWordLimit: {
        type: Boolean,
        default: props$g.input.showWordLimit
      },
      // 设置右下角按钮的文字，有效值：send|search|next|go|done，兼容性详见uni-app文档
      // https://uniapp.dcloud.io/component/input
      // https://uniapp.dcloud.io/component/textarea
      confirmType: {
        type: String,
        default: props$g.input.confirmType
      },
      // 点击键盘右下角按钮时是否保持键盘不收起，H5无效
      confirmHold: {
        type: Boolean,
        default: props$g.input.confirmHold
      },
      // focus时，点击页面的时候不收起键盘，微信小程序有效
      holdKeyboard: {
        type: Boolean,
        default: props$g.input.holdKeyboard
      },
      // 自动获取焦点
      // 在 H5 平台能否聚焦以及软键盘是否跟随弹出，取决于当前浏览器本身的实现。nvue 页面不支持，需使用组件的 focus()、blur() 方法控制焦点
      focus: {
        type: Boolean,
        default: props$g.input.focus
      },
      // 键盘收起时，是否自动失去焦点，目前仅App3.0.0+有效
      autoBlur: {
        type: Boolean,
        default: props$g.input.autoBlur
      },
      // 是否去掉 iOS 下的默认内边距，仅微信小程序，且type=textarea时有效
      disableDefaultPadding: {
        type: Boolean,
        default: props$g.input.disableDefaultPadding
      },
      // 指定focus时光标的位置
      cursor: {
        type: [String, Number],
        default: props$g.input.cursor
      },
      // 输入框聚焦时底部与键盘的距离
      cursorSpacing: {
        type: [String, Number],
        default: props$g.input.cursorSpacing
      },
      // 光标起始位置，自动聚集时有效，需与selection-end搭配使用
      selectionStart: {
        type: [String, Number],
        default: props$g.input.selectionStart
      },
      // 光标结束位置，自动聚集时有效，需与selection-start搭配使用
      selectionEnd: {
        type: [String, Number],
        default: props$g.input.selectionEnd
      },
      // 键盘弹起时，是否自动上推页面
      adjustPosition: {
        type: Boolean,
        default: props$g.input.adjustPosition
      },
      // 输入框内容对齐方式，可选值为：left|center|right
      inputAlign: {
        type: String,
        default: props$g.input.inputAlign
      },
      // 输入框字体的大小
      fontSize: {
        type: [String, Number],
        default: props$g.input.fontSize
      },
      // 输入框字体颜色
      color: {
        type: String,
        default: props$g.input.color
      },
      // 输入框前置图标
      prefixIcon: {
        type: String,
        default: props$g.input.prefixIcon
      },
      // 前置图标样式，对象或字符串
      prefixIconStyle: {
        type: [String, Object],
        default: props$g.input.prefixIconStyle
      },
      // 输入框后置图标
      suffixIcon: {
        type: String,
        default: props$g.input.suffixIcon
      },
      // 后置图标样式，对象或字符串
      suffixIconStyle: {
        type: [String, Object],
        default: props$g.input.suffixIconStyle
      },
      // 边框类型，surround-四周边框，bottom-底部边框，none-无边框
      border: {
        type: String,
        default: props$g.input.border
      },
      // 是否只读，与disabled不同之处在于disabled会置灰组件，而readonly则不会
      readonly: {
        type: Boolean,
        default: props$g.input.readonly
      },
      // 输入框形状，circle-圆形，square-方形
      shape: {
        type: String,
        default: props$g.input.shape
      },
      // 用于处理或者过滤输入框内容的方法
      formatter: {
        type: [Function, null],
        default: props$g.input.formatter
      },
      // 是否忽略组件内对文本合成系统事件的处理
      ignoreCompositionEvent: {
        type: Boolean,
        default: true
      }
    }
  };
  const _sfc_main$u = {
    name: "u-input",
    mixins: [mpMixin, mixin, props$e],
    data() {
      return {
        // 输入框的值
        innerValue: "",
        // 是否处于获得焦点状态
        focused: false,
        // value是否第一次变化，在watch中，由于加入immediate属性，会在第一次触发，此时不应该认为value发生了变化
        firstChange: true,
        // value绑定值的变化是由内部还是外部引起的
        changeFromInner: false,
        // 过滤处理方法
        innerFormatter: (value) => value
      };
    },
    watch: {
      modelValue: {
        immediate: true,
        handler(newVal, oldVal) {
          this.innerValue = newVal;
          this.firstChange = false;
          this.changeFromInner = false;
        }
      }
    },
    computed: {
      // 是否显示清除控件
      isShowClear() {
        const { clearable, readonly, focused, innerValue } = this;
        return !!clearable && !readonly && !!focused && innerValue !== "";
      },
      // 组件的类名
      inputClass() {
        let classes = [], { border, disabled, shape } = this;
        border === "surround" && (classes = classes.concat(["u-border", "u-input--radius"]));
        classes.push(`u-input--${shape}`);
        border === "bottom" && (classes = classes.concat([
          "u-border-bottom",
          "u-input--no-radius"
        ]));
        return classes.join(" ");
      },
      // 组件的样式
      wrapperStyle() {
        const style = {};
        if (this.disabled) {
          style.backgroundColor = this.disabledColor;
        }
        if (this.border === "none") {
          style.padding = "0";
        } else {
          style.paddingTop = "6px";
          style.paddingBottom = "6px";
          style.paddingLeft = "9px";
          style.paddingRight = "9px";
        }
        return uni.$u.deepMerge(style, uni.$u.addStyle(this.customStyle));
      },
      // 输入框的样式
      inputStyle() {
        const style = {
          color: this.color,
          fontSize: uni.$u.addUnit(this.fontSize),
          textAlign: this.inputAlign
        };
        return style;
      }
    },
    emits: ["update:modelValue", "focus", "blur", "change", "confirm", "clear", "keyboardheightchange"],
    methods: {
      // 在微信小程序中，不支持将函数当做props参数，故只能通过ref形式调用
      setFormatter(e) {
        this.innerFormatter = e;
      },
      // 当键盘输入时，触发input事件
      onInput(e) {
        let { value = "" } = e.detail || {};
        const formatter = this.formatter || this.innerFormatter;
        const formatValue = formatter(value);
        this.innerValue = value;
        this.$nextTick(() => {
          this.innerValue = formatValue;
          this.valueChange();
        });
      },
      // 输入框失去焦点时触发
      onBlur(event) {
        this.$emit("blur", event.detail.value);
        uni.$u.sleep(50).then(() => {
          this.focused = false;
        });
        uni.$u.formValidate(this, "blur");
      },
      // 输入框聚焦时触发
      onFocus(event) {
        this.focused = true;
        this.$emit("focus");
      },
      // 点击完成按钮时触发
      onConfirm(event) {
        this.$emit("confirm", this.innerValue);
      },
      // 键盘高度发生变化的时候触发此事件
      // 兼容性：微信小程序2.7.0+、App 3.1.0+
      onkeyboardheightchange() {
        this.$emit("keyboardheightchange");
      },
      // 内容发生变化，进行处理
      valueChange() {
        const value = this.innerValue;
        this.$nextTick(() => {
          this.$emit("update:modelValue", value);
          this.changeFromInner = true;
          this.$emit("change", value);
          uni.$u.formValidate(this, "change");
        });
      },
      // 点击清除控件
      onClear() {
        this.innerValue = "";
        this.$nextTick(() => {
          this.valueChange();
          this.$emit("clear");
        });
      },
      /**
       * 在安卓nvue上，事件无法冒泡
       * 在某些时间，我们希望监听u-from-item的点击事件，此时会导致点击u-form-item内的u-input后
       * 无法触发u-form-item的点击事件，这里通过手动调用u-form-item的方法进行触发
       */
      clickHandler() {
      }
    }
  };
  function _sfc_render$g(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$8);
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["u-input", $options.inputClass]),
        style: vue.normalizeStyle([$options.wrapperStyle])
      },
      [
        vue.createElementVNode("view", { class: "u-input__content" }, [
          _ctx.prefixIcon || _ctx.$slots.prefix ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "u-input__content__prefix-icon"
          }, [
            vue.renderSlot(_ctx.$slots, "prefix", {}, () => [
              vue.createVNode(_component_u_icon, {
                name: _ctx.prefixIcon,
                size: "18",
                customStyle: _ctx.prefixIconStyle
              }, null, 8, ["name", "customStyle"])
            ], true)
          ])) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode("view", {
            class: "u-input__content__field-wrapper",
            onClick: _cache[5] || (_cache[5] = (...args) => $options.clickHandler && $options.clickHandler(...args))
          }, [
            vue.createCommentVNode(" 根据uni-app的input组件文档，H5和APP中只要声明了password参数(无论true还是false)，type均失效，此时\n					为了防止type=number时，又存在password属性，type无效，此时需要设置password为undefined\n				 "),
            vue.createElementVNode("input", {
              class: "u-input__content__field-wrapper__field",
              style: vue.normalizeStyle([$options.inputStyle]),
              type: _ctx.type,
              focus: _ctx.focus,
              cursor: _ctx.cursor,
              value: $data.innerValue,
              "auto-blur": _ctx.autoBlur,
              disabled: _ctx.disabled || _ctx.readonly,
              maxlength: _ctx.maxlength,
              placeholder: _ctx.placeholder,
              "placeholder-style": _ctx.placeholderStyle,
              "placeholder-class": _ctx.placeholderClass,
              "confirm-type": _ctx.confirmType,
              "confirm-hold": _ctx.confirmHold,
              "hold-keyboard": _ctx.holdKeyboard,
              "cursor-spacing": _ctx.cursorSpacing,
              "adjust-position": _ctx.adjustPosition,
              "selection-end": _ctx.selectionEnd,
              "selection-start": _ctx.selectionStart,
              password: _ctx.password || _ctx.type === "password" || void 0,
              ignoreCompositionEvent: _ctx.ignoreCompositionEvent,
              onInput: _cache[0] || (_cache[0] = (...args) => $options.onInput && $options.onInput(...args)),
              onBlur: _cache[1] || (_cache[1] = (...args) => $options.onBlur && $options.onBlur(...args)),
              onFocus: _cache[2] || (_cache[2] = (...args) => $options.onFocus && $options.onFocus(...args)),
              onConfirm: _cache[3] || (_cache[3] = (...args) => $options.onConfirm && $options.onConfirm(...args)),
              onKeyboardheightchange: _cache[4] || (_cache[4] = (...args) => $options.onkeyboardheightchange && $options.onkeyboardheightchange(...args))
            }, null, 44, ["type", "focus", "cursor", "value", "auto-blur", "disabled", "maxlength", "placeholder", "placeholder-style", "placeholder-class", "confirm-type", "confirm-hold", "hold-keyboard", "cursor-spacing", "adjust-position", "selection-end", "selection-start", "password", "ignoreCompositionEvent"])
          ]),
          $options.isShowClear ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "u-input__content__clear",
            onClick: _cache[6] || (_cache[6] = (...args) => $options.onClear && $options.onClear(...args))
          }, [
            vue.createVNode(_component_u_icon, {
              name: "close",
              size: "11",
              color: "#ffffff",
              customStyle: "line-height: 12px"
            })
          ])) : vue.createCommentVNode("v-if", true),
          _ctx.suffixIcon || _ctx.$slots.suffix ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 2,
            class: "u-input__content__subfix-icon"
          }, [
            vue.renderSlot(_ctx.$slots, "suffix", {}, () => [
              vue.createVNode(_component_u_icon, {
                name: _ctx.suffixIcon,
                size: "18",
                customStyle: _ctx.suffixIconStyle
              }, null, 8, ["name", "customStyle"])
            ], true)
          ])) : vue.createCommentVNode("v-if", true)
        ])
      ],
      6
      /* CLASS, STYLE */
    );
  }
  const __easycom_0$7 = /* @__PURE__ */ _export_sfc(_sfc_main$u, [["render", _sfc_render$g], ["__scopeId", "data-v-df79975b"], ["__file", "E:/Uni-App/urshop/uni_modules/uview-plus/components/u-input/u-input.vue"]]);
  const props$d = {
    props: {
      // 是否显示组件
      show: {
        type: Boolean,
        default: props$g.loadingIcon.show
      },
      // 颜色
      color: {
        type: String,
        default: props$g.loadingIcon.color
      },
      // 提示文字颜色
      textColor: {
        type: String,
        default: props$g.loadingIcon.textColor
      },
      // 文字和图标是否垂直排列
      vertical: {
        type: Boolean,
        default: props$g.loadingIcon.vertical
      },
      // 模式选择，circle-圆形，spinner-花朵形，semicircle-半圆形
      mode: {
        type: String,
        default: props$g.loadingIcon.mode
      },
      // 图标大小，单位默认px
      size: {
        type: [String, Number],
        default: props$g.loadingIcon.size
      },
      // 文字大小
      textSize: {
        type: [String, Number],
        default: props$g.loadingIcon.textSize
      },
      // 文字内容
      text: {
        type: [String, Number],
        default: props$g.loadingIcon.text
      },
      // 动画模式
      timingFunction: {
        type: String,
        default: props$g.loadingIcon.timingFunction
      },
      // 动画执行周期时间
      duration: {
        type: [String, Number],
        default: props$g.loadingIcon.duration
      },
      // mode=circle时的暗边颜色
      inactiveColor: {
        type: String,
        default: props$g.loadingIcon.inactiveColor
      }
    }
  };
  const _sfc_main$t = {
    name: "u-loading-icon",
    mixins: [mpMixin, mixin, props$d],
    data() {
      return {
        // Array.form可以通过一个伪数组对象创建指定长度的数组
        // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/from
        array12: Array.from({
          length: 12
        }),
        // 这里需要设置默认值为360，否则在安卓nvue上，会延迟一个duration周期后才执行
        // 在iOS nvue上，则会一开始默认执行两个周期的动画
        aniAngel: 360,
        // 动画旋转角度
        webviewHide: false,
        // 监听webview的状态，如果隐藏了页面，则停止动画，以免性能消耗
        loading: false
        // 是否运行中，针对nvue使用
      };
    },
    computed: {
      // 当为circle类型时，给其另外三边设置一个更轻一些的颜色
      // 之所以需要这么做的原因是，比如父组件传了color为红色，那么需要另外的三个边为浅红色
      // 而不能是固定的某一个其他颜色(因为这个固定的颜色可能浅蓝，导致效果没有那么细腻良好)
      otherBorderColor() {
        const lightColor = uni.$u.colorGradient(this.color, "#ffffff", 100)[80];
        if (this.mode === "circle") {
          return this.inactiveColor ? this.inactiveColor : lightColor;
        } else {
          return "transparent";
        }
      }
    },
    watch: {
      show(n2) {
      }
    },
    mounted() {
      this.init();
    },
    methods: {
      init() {
        setTimeout(() => {
          this.show && this.addEventListenerToWebview();
        }, 20);
      },
      // 监听webview的显示与隐藏
      addEventListenerToWebview() {
        const pages2 = getCurrentPages();
        const page2 = pages2[pages2.length - 1];
        const currentWebview = page2.$getAppWebview();
        currentWebview.addEventListener("hide", () => {
          this.webviewHide = true;
        });
        currentWebview.addEventListener("show", () => {
          this.webviewHide = false;
        });
      }
    }
  };
  function _sfc_render$f(_ctx, _cache, $props, $setup, $data, $options) {
    return _ctx.show ? (vue.openBlock(), vue.createElementBlock(
      "view",
      {
        key: 0,
        class: vue.normalizeClass(["u-loading-icon", [_ctx.vertical && "u-loading-icon--vertical"]]),
        style: vue.normalizeStyle([_ctx.$u.addStyle(_ctx.customStyle)])
      },
      [
        !$data.webviewHide ? (vue.openBlock(), vue.createElementBlock(
          "view",
          {
            key: 0,
            class: vue.normalizeClass(["u-loading-icon__spinner", [`u-loading-icon__spinner--${_ctx.mode}`]]),
            ref: "ani",
            style: vue.normalizeStyle({
              color: _ctx.color,
              width: _ctx.$u.addUnit(_ctx.size),
              height: _ctx.$u.addUnit(_ctx.size),
              borderTopColor: _ctx.color,
              borderBottomColor: $options.otherBorderColor,
              borderLeftColor: $options.otherBorderColor,
              borderRightColor: $options.otherBorderColor,
              "animation-duration": `${_ctx.duration}ms`,
              "animation-timing-function": _ctx.mode === "semicircle" || _ctx.mode === "circle" ? _ctx.timingFunction : ""
            })
          },
          [
            _ctx.mode === "spinner" ? (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              { key: 0 },
              vue.renderList($data.array12, (item, index2) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: index2,
                  class: "u-loading-icon__dot"
                });
              }),
              128
              /* KEYED_FRAGMENT */
            )) : vue.createCommentVNode("v-if", true)
          ],
          6
          /* CLASS, STYLE */
        )) : vue.createCommentVNode("v-if", true),
        _ctx.text ? (vue.openBlock(), vue.createElementBlock(
          "text",
          {
            key: 1,
            class: "u-loading-icon__text",
            style: vue.normalizeStyle({
              fontSize: _ctx.$u.addUnit(_ctx.textSize),
              color: _ctx.textColor
            })
          },
          vue.toDisplayString(_ctx.text),
          5
          /* TEXT, STYLE */
        )) : vue.createCommentVNode("v-if", true)
      ],
      6
      /* CLASS, STYLE */
    )) : vue.createCommentVNode("v-if", true);
  }
  const __easycom_0$6 = /* @__PURE__ */ _export_sfc(_sfc_main$t, [["render", _sfc_render$f], ["__scopeId", "data-v-2af81691"], ["__file", "E:/Uni-App/urshop/uni_modules/uview-plus/components/u-loading-icon/u-loading-icon.vue"]]);
  const props$c = {
    props: {
      // 是否细边框
      hairline: {
        type: Boolean,
        default: props$g.button.hairline
      },
      // 按钮的预置样式，info，primary，error，warning，success
      type: {
        type: String,
        default: props$g.button.type
      },
      // 按钮尺寸，large，normal，small，mini
      size: {
        type: String,
        default: props$g.button.size
      },
      // 按钮形状，circle（两边为半圆），square（带圆角）
      shape: {
        type: String,
        default: props$g.button.shape
      },
      // 按钮是否镂空
      plain: {
        type: Boolean,
        default: props$g.button.plain
      },
      // 是否禁止状态
      disabled: {
        type: Boolean,
        default: props$g.button.disabled
      },
      // 是否加载中
      loading: {
        type: Boolean,
        default: props$g.button.loading
      },
      // 加载中提示文字
      loadingText: {
        type: [String, Number],
        default: props$g.button.loadingText
      },
      // 加载状态图标类型
      loadingMode: {
        type: String,
        default: props$g.button.loadingMode
      },
      // 加载图标大小
      loadingSize: {
        type: [String, Number],
        default: props$g.button.loadingSize
      },
      // 开放能力，具体请看uniapp稳定关于button组件部分说明
      // https://uniapp.dcloud.io/component/button
      openType: {
        type: String,
        default: props$g.button.openType
      },
      // 用于 <form> 组件，点击分别会触发 <form> 组件的 submit/reset 事件
      // 取值为submit（提交表单），reset（重置表单）
      formType: {
        type: String,
        default: props$g.button.formType
      },
      // 打开 APP 时，向 APP 传递的参数，open-type=launchApp时有效
      // 只微信小程序、QQ小程序有效
      appParameter: {
        type: String,
        default: props$g.button.appParameter
      },
      // 指定是否阻止本节点的祖先节点出现点击态，微信小程序有效
      hoverStopPropagation: {
        type: Boolean,
        default: props$g.button.hoverStopPropagation
      },
      // 指定返回用户信息的语言，zh_CN 简体中文，zh_TW 繁体中文，en 英文。只微信小程序有效
      lang: {
        type: String,
        default: props$g.button.lang
      },
      // 会话来源，open-type="contact"时有效。只微信小程序有效
      sessionFrom: {
        type: String,
        default: props$g.button.sessionFrom
      },
      // 会话内消息卡片标题，open-type="contact"时有效
      // 默认当前标题，只微信小程序有效
      sendMessageTitle: {
        type: String,
        default: props$g.button.sendMessageTitle
      },
      // 会话内消息卡片点击跳转小程序路径，open-type="contact"时有效
      // 默认当前分享路径，只微信小程序有效
      sendMessagePath: {
        type: String,
        default: props$g.button.sendMessagePath
      },
      // 会话内消息卡片图片，open-type="contact"时有效
      // 默认当前页面截图，只微信小程序有效
      sendMessageImg: {
        type: String,
        default: props$g.button.sendMessageImg
      },
      // 是否显示会话内消息卡片，设置此参数为 true，用户进入客服会话会在右下角显示"可能要发送的小程序"提示，
      // 用户点击后可以快速发送小程序消息，open-type="contact"时有效
      showMessageCard: {
        type: Boolean,
        default: props$g.button.showMessageCard
      },
      // 额外传参参数，用于小程序的data-xxx属性，通过target.dataset.name获取
      dataName: {
        type: String,
        default: props$g.button.dataName
      },
      // 节流，一定时间内只能触发一次
      throttleTime: {
        type: [String, Number],
        default: props$g.button.throttleTime
      },
      // 按住后多久出现点击态，单位毫秒
      hoverStartTime: {
        type: [String, Number],
        default: props$g.button.hoverStartTime
      },
      // 手指松开后点击态保留时间，单位毫秒
      hoverStayTime: {
        type: [String, Number],
        default: props$g.button.hoverStayTime
      },
      // 按钮文字，之所以通过props传入，是因为slot传入的话
      // nvue中无法控制文字的样式
      text: {
        type: [String, Number],
        default: props$g.button.text
      },
      // 按钮图标
      icon: {
        type: String,
        default: props$g.button.icon
      },
      // 按钮图标
      iconColor: {
        type: String,
        default: props$g.button.icon
      },
      // 按钮颜色，支持传入linear-gradient渐变色
      color: {
        type: String,
        default: props$g.button.color
      }
    }
  };
  const _sfc_main$s = {
    name: "u-button",
    mixins: [mpMixin, mixin, props$c],
    data() {
      return {};
    },
    computed: {
      // 生成bem风格的类名
      bemClass() {
        if (!this.color) {
          return this.bem(
            "button",
            ["type", "shape", "size"],
            ["disabled", "plain", "hairline"]
          );
        } else {
          return this.bem(
            "button",
            ["shape", "size"],
            ["disabled", "plain", "hairline"]
          );
        }
      },
      loadingColor() {
        if (this.plain) {
          return this.color ? this.color : uni.$u.config.color[`u-${this.type}`];
        }
        if (this.type === "info") {
          return "#c9c9c9";
        }
        return "rgb(200, 200, 200)";
      },
      iconColorCom() {
        if (this.iconColor)
          return this.iconColor;
        if (this.plain) {
          return this.color ? this.color : this.type;
        } else {
          return this.type === "info" ? "#000000" : "#ffffff";
        }
      },
      baseColor() {
        let style = {};
        if (this.color) {
          style.color = this.plain ? this.color : "white";
          if (!this.plain) {
            style["background-color"] = this.color;
          }
          if (this.color.indexOf("gradient") !== -1) {
            style.borderTopWidth = 0;
            style.borderRightWidth = 0;
            style.borderBottomWidth = 0;
            style.borderLeftWidth = 0;
            if (!this.plain) {
              style.backgroundImage = this.color;
            }
          } else {
            style.borderColor = this.color;
            style.borderWidth = "1px";
            style.borderStyle = "solid";
          }
        }
        return style;
      },
      // nvue版本按钮的字体不会继承父组件的颜色，需要对每一个text组件进行单独的设置
      nvueTextStyle() {
        let style = {};
        if (this.type === "info") {
          style.color = "#323233";
        }
        if (this.color) {
          style.color = this.plain ? this.color : "white";
        }
        style.fontSize = this.textSize + "px";
        return style;
      },
      // 字体大小
      textSize() {
        let fontSize = 14, { size } = this;
        if (size === "large")
          fontSize = 16;
        if (size === "normal")
          fontSize = 14;
        if (size === "small")
          fontSize = 12;
        if (size === "mini")
          fontSize = 10;
        return fontSize;
      }
    },
    emits: [
      "click",
      "getphonenumber",
      "getuserinfo",
      "error",
      "opensetting",
      "launchapp"
    ],
    methods: {
      clickHandler() {
        if (!this.disabled && !this.loading) {
          uni.$u.throttle(() => {
            this.$emit("click");
          }, this.throttleTime);
        }
      },
      // 下面为对接uniapp官方按钮开放能力事件回调的对接
      getphonenumber(res) {
        this.$emit("getphonenumber", res);
      },
      getuserinfo(res) {
        this.$emit("getuserinfo", res);
      },
      error(res) {
        this.$emit("error", res);
      },
      opensetting(res) {
        this.$emit("opensetting", res);
      },
      launchapp(res) {
        this.$emit("launchapp", res);
      }
    }
  };
  function _sfc_render$e(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_loading_icon = resolveEasycom(vue.resolveDynamicComponent("u-loading-icon"), __easycom_0$6);
    const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$8);
    return vue.openBlock(), vue.createElementBlock("button", {
      "hover-start-time": Number(_ctx.hoverStartTime),
      "hover-stay-time": Number(_ctx.hoverStayTime),
      "form-type": _ctx.formType,
      "open-type": _ctx.openType,
      "app-parameter": _ctx.appParameter,
      "hover-stop-propagation": _ctx.hoverStopPropagation,
      "send-message-title": _ctx.sendMessageTitle,
      "send-message-path": _ctx.sendMessagePath,
      lang: _ctx.lang,
      "data-name": _ctx.dataName,
      "session-from": _ctx.sessionFrom,
      "send-message-img": _ctx.sendMessageImg,
      "show-message-card": _ctx.showMessageCard,
      onGetphonenumber: _cache[0] || (_cache[0] = (...args) => $options.getphonenumber && $options.getphonenumber(...args)),
      onGetuserinfo: _cache[1] || (_cache[1] = (...args) => $options.getuserinfo && $options.getuserinfo(...args)),
      onError: _cache[2] || (_cache[2] = (...args) => $options.error && $options.error(...args)),
      onOpensetting: _cache[3] || (_cache[3] = (...args) => $options.opensetting && $options.opensetting(...args)),
      onLaunchapp: _cache[4] || (_cache[4] = (...args) => $options.launchapp && $options.launchapp(...args)),
      "hover-class": !_ctx.disabled && !_ctx.loading ? "u-button--active" : "",
      class: vue.normalizeClass(["u-button u-reset-button", $options.bemClass]),
      style: vue.normalizeStyle([$options.baseColor, _ctx.$u.addStyle(_ctx.customStyle)]),
      onClick: _cache[5] || (_cache[5] = (...args) => $options.clickHandler && $options.clickHandler(...args))
    }, [
      _ctx.loading ? (vue.openBlock(), vue.createElementBlock(
        vue.Fragment,
        { key: 0 },
        [
          vue.createVNode(_component_u_loading_icon, {
            mode: _ctx.loadingMode,
            size: _ctx.loadingSize * 1.15,
            color: $options.loadingColor
          }, null, 8, ["mode", "size", "color"]),
          vue.createElementVNode(
            "text",
            {
              class: "u-button__loading-text",
              style: vue.normalizeStyle([{ fontSize: $options.textSize + "px" }])
            },
            vue.toDisplayString(_ctx.loadingText || _ctx.text),
            5
            /* TEXT, STYLE */
          )
        ],
        64
        /* STABLE_FRAGMENT */
      )) : (vue.openBlock(), vue.createElementBlock(
        vue.Fragment,
        { key: 1 },
        [
          _ctx.icon ? (vue.openBlock(), vue.createBlock(_component_u_icon, {
            key: 0,
            name: _ctx.icon,
            color: $options.iconColorCom,
            size: $options.textSize * 1.35,
            customStyle: { marginRight: "2px" }
          }, null, 8, ["name", "color", "size"])) : vue.createCommentVNode("v-if", true),
          vue.renderSlot(_ctx.$slots, "default", {}, () => [
            vue.createElementVNode(
              "text",
              {
                class: "u-button__text",
                style: vue.normalizeStyle([{ fontSize: $options.textSize + "px" }])
              },
              vue.toDisplayString(_ctx.text),
              5
              /* TEXT, STYLE */
            )
          ], true)
        ],
        64
        /* STABLE_FRAGMENT */
      ))
    ], 46, ["hover-start-time", "hover-stay-time", "form-type", "open-type", "app-parameter", "hover-stop-propagation", "send-message-title", "send-message-path", "lang", "data-name", "session-from", "send-message-img", "show-message-card", "hover-class"]);
  }
  const __easycom_0$5 = /* @__PURE__ */ _export_sfc(_sfc_main$s, [["render", _sfc_render$e], ["__scopeId", "data-v-5ce41ee6"], ["__file", "E:/Uni-App/urshop/uni_modules/uview-plus/components/u-button/u-button.vue"]]);
  const _sfc_main$r = {
    __name: "Login",
    setup(__props) {
      const username = vue.ref("admin");
      const password = vue.ref("123456");
      const login = () => {
        if (username.value === "admin" && password.value === "123456") {
          uni.showToast({
            title: "登录成功",
            duration: 1500,
            icon: "success"
          });
          formatAppLog("log", "at pages/Login/Login.vue:33", "登陆成功");
          uni.setStorageSync("token", username.value);
          uni.reLaunch({
            url: "/pages/index/index"
          });
        } else {
          uni.showToast({
            title: "用户名或密码错误",
            duration: 1500,
            icon: "none"
          });
        }
      };
      return (_ctx, _cache) => {
        const _component_u_input = resolveEasycom(vue.resolveDynamicComponent("u-input"), __easycom_0$7);
        const _component_u_button = resolveEasycom(vue.resolveDynamicComponent("u-button"), __easycom_0$5);
        return vue.openBlock(), vue.createElementBlock("view", { class: "login-container" }, [
          vue.createElementVNode("view", { class: "login-logo" }, "登录"),
          vue.createElementVNode("view", { class: "login-form" }, [
            vue.createVNode(_component_u_input, {
              modelValue: username.value,
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => username.value = $event),
              placeholder: "请输入用户名",
              clear: "",
              maxlength: "20"
            }, null, 8, ["modelValue"]),
            vue.createVNode(_component_u_input, {
              modelValue: password.value,
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => password.value = $event),
              placeholder: "请输入密码",
              clear: "",
              password: "",
              maxlength: "16"
            }, null, 8, ["modelValue"]),
            vue.createVNode(_component_u_button, {
              round: "",
              type: "primary",
              onClick: login
            }, {
              default: vue.withCtx(() => [
                vue.createTextVNode("登录")
              ]),
              _: 1
              /* STABLE */
            })
          ])
        ]);
      };
    }
  };
  const PagesLoginLogin = /* @__PURE__ */ _export_sfc(_sfc_main$r, [["__scopeId", "data-v-461d1d79"], ["__file", "E:/Uni-App/urshop/pages/Login/Login.vue"]]);
  const props$b = {
    props: {
      // 搜索框形状，round-圆形，square-方形
      shape: {
        type: String,
        default: props$g.search.shape
      },
      // 搜索框背景色，默认值#f2f2f2
      bgColor: {
        type: String,
        default: props$g.search.bgColor
      },
      // 占位提示文字
      placeholder: {
        type: String,
        default: props$g.search.placeholder
      },
      // 是否启用清除控件
      clearabled: {
        type: Boolean,
        default: props$g.search.clearabled
      },
      // 是否自动聚焦
      focus: {
        type: Boolean,
        default: props$g.search.focus
      },
      // 是否在搜索框右侧显示取消按钮
      showAction: {
        type: Boolean,
        default: props$g.search.showAction
      },
      // 右边控件的样式
      actionStyle: {
        type: Object,
        default: props$g.search.actionStyle
      },
      // 取消按钮文字
      actionText: {
        type: String,
        default: props$g.search.actionText
      },
      // 输入框内容对齐方式，可选值为 left|center|right
      inputAlign: {
        type: String,
        default: props$g.search.inputAlign
      },
      // input输入框的样式，可以定义文字颜色，大小等，对象形式
      inputStyle: {
        type: Object,
        default: props$g.search.inputStyle
      },
      // 是否启用输入框
      disabled: {
        type: Boolean,
        default: props$g.search.disabled
      },
      // 边框颜色
      borderColor: {
        type: String,
        default: props$g.search.borderColor
      },
      // 搜索图标的颜色，默认同输入框字体颜色
      searchIconColor: {
        type: String,
        default: props$g.search.searchIconColor
      },
      // 输入框字体颜色
      color: {
        type: String,
        default: props$g.search.color
      },
      // placeholder的颜色
      placeholderColor: {
        type: String,
        default: props$g.search.placeholderColor
      },
      // 左边输入框的图标，可以为uView图标名称或图片路径
      searchIcon: {
        type: String,
        default: props$g.search.searchIcon
      },
      searchIconSize: {
        type: [Number, String],
        default: props$g.search.searchIconSize
      },
      // 组件与其他上下左右元素之间的距离，带单位的字符串形式，如"30px"、"30px 20px"等写法
      margin: {
        type: String,
        default: props$g.search.margin
      },
      // 开启showAction时，是否在input获取焦点时才显示
      animation: {
        type: Boolean,
        default: props$g.search.animation
      },
      // 输入框的初始化内容
      modelValue: {
        type: String,
        default: props$g.search.value
      },
      value: {
        type: String,
        default: props$g.search.value
      },
      // 输入框最大能输入的长度，-1为不限制长度(来自uniapp文档)
      maxlength: {
        type: [String, Number],
        default: props$g.search.maxlength
      },
      // 搜索框高度，单位px
      height: {
        type: [String, Number],
        default: props$g.search.height
      },
      // 搜索框左侧文本
      label: {
        type: [String, Number, null],
        default: props$g.search.label
      }
    }
  };
  const _sfc_main$q = {
    name: "u-search",
    mixins: [mpMixin, mixin, props$b],
    data() {
      return {
        keyword: "",
        showClear: false,
        // 是否显示右边的清除图标
        show: false,
        // 标记input当前状态是否处于聚焦中，如果是，才会显示右侧的清除控件
        focused: this.focus
        // 绑定输入框的值
        // inputValue: this.value
      };
    },
    watch: {
      keyword(nVal) {
        this.$emit("update:modelValue", nVal);
        this.$emit("change", nVal);
      },
      modelValue: {
        immediate: true,
        handler(nVal) {
          this.keyword = nVal;
        }
      }
    },
    computed: {
      showActionBtn() {
        return !this.animation && this.showAction;
      }
    },
    emits: ["clear", "search", "custom", "focus", "blur", "click", "clickIcon", "update:modelValue", "change"],
    methods: {
      // 目前HX2.6.9 v-model双向绑定无效，故监听input事件获取输入框内容的变化
      inputChange(e) {
        this.keyword = e.detail.value;
      },
      // 清空输入
      // 也可以作为用户通过this.$refs形式调用清空输入框内容
      clear() {
        this.keyword = "";
        this.$nextTick(() => {
          this.$emit("clear");
        });
      },
      // 确定搜索
      search(e) {
        this.$emit("search", e.detail.value);
        try {
          uni.hideKeyboard();
        } catch (e2) {
        }
      },
      // 点击右边自定义按钮的事件
      custom() {
        this.$emit("custom", this.keyword);
        try {
          uni.hideKeyboard();
        } catch (e) {
        }
      },
      // 获取焦点
      getFocus() {
        this.focused = true;
        if (this.animation && this.showAction)
          this.show = true;
        this.$emit("focus", this.keyword);
      },
      // 失去焦点
      blur() {
        setTimeout(() => {
          this.focused = false;
        }, 100);
        this.show = false;
        this.$emit("blur", this.keyword);
      },
      // 点击搜索框，只有disabled=true时才发出事件，因为禁止了输入，意味着是想跳转真正的搜索页
      clickHandler() {
        if (this.disabled)
          this.$emit("click");
      },
      // 点击左边图标
      clickIcon() {
        this.$emit("clickIcon");
      }
    }
  };
  function _sfc_render$d(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$8);
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: "u-search",
        onClick: _cache[6] || (_cache[6] = (...args) => $options.clickHandler && $options.clickHandler(...args)),
        style: vue.normalizeStyle([{
          margin: _ctx.margin
        }, _ctx.$u.addStyle(_ctx.customStyle)])
      },
      [
        vue.createElementVNode(
          "view",
          {
            class: "u-search__content",
            style: vue.normalizeStyle({
              backgroundColor: _ctx.bgColor,
              borderRadius: _ctx.shape == "round" ? "100px" : "4px",
              borderColor: _ctx.borderColor
            })
          },
          [
            _ctx.$slots.label || _ctx.label !== null ? vue.renderSlot(_ctx.$slots, "label", { key: 0 }, () => [
              vue.createElementVNode(
                "text",
                { class: "u-search__content__label" },
                vue.toDisplayString(_ctx.label),
                1
                /* TEXT */
              )
            ], true) : vue.createCommentVNode("v-if", true),
            vue.createElementVNode("view", { class: "u-search__content__icon" }, [
              vue.createVNode(_component_u_icon, {
                onClick: $options.clickIcon,
                size: _ctx.searchIconSize,
                name: _ctx.searchIcon,
                color: _ctx.searchIconColor ? _ctx.searchIconColor : _ctx.color
              }, null, 8, ["onClick", "size", "name", "color"])
            ]),
            vue.createElementVNode("input", {
              "confirm-type": "search",
              onBlur: _cache[0] || (_cache[0] = (...args) => $options.blur && $options.blur(...args)),
              value: $data.keyword,
              onConfirm: _cache[1] || (_cache[1] = (...args) => $options.search && $options.search(...args)),
              onInput: _cache[2] || (_cache[2] = (...args) => $options.inputChange && $options.inputChange(...args)),
              disabled: _ctx.disabled,
              onFocus: _cache[3] || (_cache[3] = (...args) => $options.getFocus && $options.getFocus(...args)),
              focus: _ctx.focus,
              maxlength: _ctx.maxlength,
              "placeholder-class": "u-search__content__input--placeholder",
              placeholder: _ctx.placeholder,
              "placeholder-style": `color: ${_ctx.placeholderColor}`,
              class: "u-search__content__input",
              type: "text",
              style: vue.normalizeStyle([{
                textAlign: _ctx.inputAlign,
                color: _ctx.color,
                backgroundColor: _ctx.bgColor,
                height: _ctx.$u.addUnit(_ctx.height)
              }, _ctx.inputStyle])
            }, null, 44, ["value", "disabled", "focus", "maxlength", "placeholder", "placeholder-style"]),
            $data.keyword && _ctx.clearabled && $data.focused ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "u-search__content__icon u-search__content__close",
              onClick: _cache[4] || (_cache[4] = (...args) => $options.clear && $options.clear(...args))
            }, [
              vue.createVNode(_component_u_icon, {
                name: "close",
                size: "11",
                color: "#ffffff",
                customStyle: "line-height: 12px"
              })
            ])) : vue.createCommentVNode("v-if", true)
          ],
          4
          /* STYLE */
        ),
        vue.createElementVNode(
          "text",
          {
            style: vue.normalizeStyle([_ctx.actionStyle]),
            class: vue.normalizeClass(["u-search__action", [($options.showActionBtn || $data.show) && "u-search__action--active"]]),
            onClick: _cache[5] || (_cache[5] = vue.withModifiers((...args) => $options.custom && $options.custom(...args), ["stop", "prevent"]))
          },
          vue.toDisplayString(_ctx.actionText),
          7
          /* TEXT, CLASS, STYLE */
        )
      ],
      4
      /* STYLE */
    );
  }
  const __easycom_0$4 = /* @__PURE__ */ _export_sfc(_sfc_main$q, [["render", _sfc_render$d], ["__scopeId", "data-v-e082a34a"], ["__file", "E:/Uni-App/urshop/uni_modules/uview-plus/components/u-search/u-search.vue"]]);
  const request = (params) => {
    return uni.request({
      url: `http://demo.urshop.cn/api/${params.url}`,
      data: params.params
    }).then((res) => {
      return res.data;
    });
  };
  const getABannerList = (params) => {
    return request({
      url: "v1/common/banner",
      params
    });
  };
  const getACategortList = (path) => {
    return request({
      url: `v1/category/${path}`
    });
  };
  const getABannerList2 = (params) => {
    return request({
      url: "v1/common/banner",
      params
    });
  };
  const getAProductList = (params) => {
    return request({
      url: "v1/search/findbycid",
      params
    });
  };
  const getASubList = (params) => {
    return request({
      url: "v1/category/sublist",
      params
    });
  };
  const getFindbycid = (params) => {
    return request({
      url: "v1/search/findbycid",
      params
    });
  };
  const getAboutus = (params) => {
    return request({
      url: "v1/topic/detail",
      params
    });
  };
  const getSearch = (params) => {
    return request({
      url: "v1/search/find",
      params
    });
  };
  const _sfc_main$p = {
    __name: "index",
    setup(__props) {
      const AdresList = vue.ref({
        Name: "新地区",
        Remark: "的撒"
      });
      vue.ref();
      const search = (e) => {
        uni.navigateTo({
          url: `../search/search?value=${e}`
        });
      };
      const contactCallback = (e) => {
        formatAppLog("log", "at pages/index/index.vue:96", e);
      };
      const bannerList = vue.ref([]);
      const bannerList2 = vue.ref([]);
      const CategortList = vue.ref([]);
      const productlist = vue.ref([]);
      onLoad(async () => {
        await Promise.all([
          getABannerList({ name: "homehotbanner" }),
          getABannerList2({ name: "homehotbanner-second-mobile" }),
          getACategortList("homecategories"),
          getAProductList({ cid: 105, size: 20 })
        ]).then(([bannerRes, banner2Res, categoryRes, productlistres]) => {
          formatAppLog("log", "at pages/index/index.vue:117", bannerRes);
          bannerList.value = bannerRes.Data.Items;
          bannerList2.value = banner2Res.Data.Items[0].Picture;
          CategortList.value = categoryRes.Data;
          productlist.value = productlistres.Data;
        }).catch((err) => {
          formatAppLog("log", "at pages/index/index.vue:124", err);
        });
      });
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$8);
        const _component_u_search = resolveEasycom(vue.resolveDynamicComponent("u-search"), __easycom_0$4);
        return vue.openBlock(), vue.createElementBlock("view", { class: "index" }, [
          vue.createElementVNode("navigator", {
            url: "/pages/options/options",
            class: "address"
          }, [
            vue.createElementVNode(
              "text",
              { class: "line marb" },
              "当前分店：" + vue.toDisplayString(AdresList.value.Name),
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "text",
              { class: "line" },
              "分店地址：" + vue.toDisplayString(AdresList.value.Remark),
              1
              /* TEXT */
            ),
            vue.createVNode(_component_u_icon, { name: "arrow-right" })
          ]),
          vue.createElementVNode("view", { class: "search" }, [
            vue.createVNode(_component_u_search, {
              onSearch: search,
              bgColor: "#fff",
              "show-action": false,
              clearabled: true,
              shape: "round",
              placeholder: "搜一搜"
            })
          ]),
          vue.createCommentVNode(" 轮播图 "),
          vue.createElementVNode("view", { class: "swiper" }, [
            vue.createElementVNode("swiper", {
              class: "swiper",
              circular: "",
              autoplay: ""
            }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(bannerList.value, (item, index2) => {
                  return vue.openBlock(), vue.createElementBlock("swiper-item", { key: index2 }, [
                    vue.createElementVNode("view", { class: "swiper-item uni-bg-red" }, [
                      vue.createElementVNode("navigator", {
                        url: item.Url
                      }, [
                        vue.createElementVNode("image", {
                          src: item.Picture.BigUrl
                        }, null, 8, ["src"])
                      ], 8, ["url"])
                    ])
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ]),
          vue.createElementVNode("view", { class: "wxParse" }),
          vue.createElementVNode("view", { class: "short-list" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(CategortList.value, (item, index2) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "list-item",
                  key: index2
                }, [
                  vue.createElementVNode("navigator", {
                    class: "pic",
                    url: `/pages/subcategory/subcategory?id=${item.Id}&name=${item.Name}`,
                    role: "navigation"
                  }, [
                    vue.createElementVNode("view", { class: "shop-img" }, [
                      vue.createElementVNode("image", {
                        src: item.Picture.BigUrl
                      }, null, 8, ["src"])
                    ]),
                    vue.createElementVNode(
                      "text",
                      null,
                      vue.toDisplayString(item.Name),
                      1
                      /* TEXT */
                    )
                  ], 8, ["url"])
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          vue.createElementVNode("view", { class: "banner" }, [
            vue.createCommentVNode(' @click="bannerHref" '),
            bannerList2.value ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "banner-img"
            }, [
              vue.createElementVNode("image", {
                src: bannerList2.value.BigUrl
              }, null, 8, ["src"]),
              vue.createElementVNode("view", {
                class: "btn",
                hidden: ""
              }, "立即领取")
            ])) : vue.createCommentVNode("v-if", true)
          ]),
          productlist.value.Items && productlist.value.Items.length ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "hot-intro"
          }, [
            vue.createTextVNode(
              vue.toDisplayString(productlist.value.Name),
              1
              /* TEXT */
            ),
            vue.createElementVNode("navigator", {
              url: "/pages/subcategory/subcategory?id={{productlist.Id}}",
              class: "group-list-btn"
            }, "查看更多 > ")
          ])) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode("view", { class: "product-view2" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(productlist.value.Items, (item, index2) => {
                return vue.openBlock(), vue.createElementBlock("navigator", {
                  key: index2,
                  url: `/pages/detail/detail?id=${item.Id}`,
                  class: "product-view2-box"
                }, [
                  vue.createElementVNode("view", { class: "product-img" }, [
                    vue.createElementVNode("image", {
                      src: item.Picture.NormalUrl
                    }, null, 8, ["src"])
                  ]),
                  vue.createElementVNode("view", { class: "pruduct-info" }, [
                    vue.createElementVNode("view", { class: "product-t" }, [
                      vue.createElementVNode("span", {
                        class: "product-name",
                        "data-detailId": item.Id
                      }, vue.toDisplayString(item.Name), 9, ["data-detailId"]),
                      vue.createElementVNode("span", {
                        class: "product-srot",
                        "data-detailId": item.Id
                      }, vue.toDisplayString(item.Short), 9, ["data-detailId"])
                    ]),
                    vue.createElementVNode("view", { class: "price" }, [
                      vue.createElementVNode(
                        "span",
                        { class: "product-price price-color" },
                        vue.toDisplayString(item.Price.Price),
                        1
                        /* TEXT */
                      ),
                      item.Price.OldPrice !== "¥0.00" ? (vue.openBlock(), vue.createElementBlock(
                        "span",
                        {
                          key: 0,
                          class: "product-oldprice"
                        },
                        vue.toDisplayString(item.Price.OldPrice),
                        1
                        /* TEXT */
                      )) : vue.createCommentVNode("v-if", true)
                    ])
                  ])
                ], 8, ["url"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          vue.createElementVNode("view", { class: "intro" }, [
            vue.createElementVNode("image", { src: "https://7769-windtest1-4gjy5wl0d7f80453-1309457816.tcb.qcloud.la/huihua.png" }),
            vue.createElementVNode(
              "button",
              {
                "open-type": "contact",
                class: "kefu-btn",
                onContact: contactCallback
              },
              null,
              32
              /* HYDRATE_EVENTS */
            )
          ])
        ]);
      };
    }
  };
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$p, [["__scopeId", "data-v-1cf27b2a"], ["__file", "E:/Uni-App/urshop/pages/index/index.vue"]]);
  const _sfc_main$o = {
    __name: "category",
    setup(__props) {
      const search = (e) => {
        formatAppLog("log", "at pages/category/category.vue:72", e);
      };
      let selected = vue.ref(0);
      let cateProduct0 = vue.ref([]);
      let cateProduct1 = vue.ref([]);
      let cateProduct2 = vue.ref([]);
      let cateProduct3 = vue.ref([]);
      const selectTab = async (index2) => {
        selected.value = index2;
      };
      let sublist = vue.ref([]);
      onLoad(async () => {
        const subListRes = await getASubList();
        sublist.value = subListRes.Data;
        await Promise.all([
          await getFindbycid({ cid: sublist.value[0].Id, page: 1 }),
          await getASubList({ catId: sublist.value[1].Id }),
          await getFindbycid({ cid: sublist.value[2].Id, page: 1 }),
          await getFindbycid({ cid: sublist.value[3].Id, page: 1 })
        ]).then(([findRes0, findRes1, findRes2, findRes3]) => {
          cateProduct0.value = findRes0.Data.Items;
          cateProduct1.value = findRes1.Data;
          cateProduct2.value = findRes2.Data.Items;
          cateProduct3.value = findRes3.Data.Items;
        }).catch((err) => {
          formatAppLog("log", "at pages/category/category.vue:102", err);
        });
      });
      return (_ctx, _cache) => {
        const _component_u_search = resolveEasycom(vue.resolveDynamicComponent("u-search"), __easycom_0$4);
        return vue.openBlock(), vue.createElementBlock("view", null, [
          vue.createElementVNode("view", { class: "search" }, [
            vue.createVNode(_component_u_search, {
              onSearch: search,
              bgColor: "#fff",
              "show-action": false,
              clearabled: true,
              shape: "round",
              placeholder: "搜一搜"
            })
          ]),
          vue.createElementVNode("view", { class: "cantainer" }, [
            vue.createElementVNode("scroll-view", { class: "tabs" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(vue.unref(sublist), (item, index2) => {
                  return vue.openBlock(), vue.createElementBlock(
                    vue.Fragment,
                    { key: index2 },
                    [
                      index2 !== 4 ? (vue.openBlock(), vue.createElementBlock("view", {
                        key: 0,
                        class: vue.normalizeClass(["item", { "selected": vue.unref(selected) === index2 }]),
                        onClick: ($event) => selectTab(index2)
                      }, vue.toDisplayString(item.Name), 11, ["onClick"])) : vue.createCommentVNode("v-if", true)
                    ],
                    64
                    /* STABLE_FRAGMENT */
                  );
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ]),
            vue.createElementVNode("scroll-view", {
              "scroll-y": "",
              class: "con"
            }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(vue.unref(sublist), (item, index2) => {
                  return vue.openBlock(), vue.createElementBlock(
                    vue.Fragment,
                    { key: index2 },
                    [
                      index2 !== 4 && vue.unref(selected) == index2 ? (vue.openBlock(), vue.createElementBlock("view", {
                        key: 0,
                        class: "tabs_con"
                      }, [
                        vue.createCommentVNode(" 可使用字符串拼接使用cateProduct1来渐少代码量 "),
                        index2 == 1 ? (vue.openBlock(true), vue.createElementBlock(
                          vue.Fragment,
                          { key: 0 },
                          vue.renderList(vue.unref(cateProduct1), (item1, index1) => {
                            return vue.openBlock(), vue.createElementBlock("navigator", {
                              key: index1,
                              url: `/pages/subcategory/subcategory?id=${item1.Id}`,
                              role: "navigation",
                              class: "item"
                            }, [
                              vue.createElementVNode("image", {
                                "lazy-load": "true",
                                src: item1.ImageUrl
                              }, null, 8, ["src"]),
                              vue.createElementVNode(
                                "view",
                                { class: "text" },
                                vue.toDisplayString(item1.Name),
                                1
                                /* TEXT */
                              )
                            ], 8, ["url"]);
                          }),
                          128
                          /* KEYED_FRAGMENT */
                        )) : vue.createCommentVNode("v-if", true),
                        index2 == 0 ? (vue.openBlock(true), vue.createElementBlock(
                          vue.Fragment,
                          { key: 1 },
                          vue.renderList(vue.unref(cateProduct0), (item2, index22) => {
                            return vue.openBlock(), vue.createElementBlock("navigator", {
                              key: index22,
                              url: `/pages/detail/detail?id=${item2.Id}`,
                              role: "navigation",
                              class: "item"
                            }, [
                              vue.createElementVNode("image", {
                                "lazy-load": "true",
                                src: item2.Picture.NormalUrl
                              }, null, 8, ["src"]),
                              vue.createElementVNode(
                                "view",
                                { class: "text" },
                                vue.toDisplayString(item2.Name),
                                1
                                /* TEXT */
                              )
                            ], 8, ["url"]);
                          }),
                          128
                          /* KEYED_FRAGMENT */
                        )) : vue.createCommentVNode("v-if", true),
                        index2 == 2 ? (vue.openBlock(true), vue.createElementBlock(
                          vue.Fragment,
                          { key: 2 },
                          vue.renderList(vue.unref(cateProduct2), (item2, index22) => {
                            return vue.openBlock(), vue.createElementBlock("navigator", {
                              key: index22,
                              url: `/pages/detail/detail?id=${item2.Id}`,
                              role: "navigation",
                              class: "item"
                            }, [
                              vue.createElementVNode("image", {
                                "lazy-load": "true",
                                src: item2.Picture.NormalUrl
                              }, null, 8, ["src"]),
                              vue.createElementVNode(
                                "view",
                                { class: "text" },
                                vue.toDisplayString(item2.Name),
                                1
                                /* TEXT */
                              )
                            ], 8, ["url"]);
                          }),
                          128
                          /* KEYED_FRAGMENT */
                        )) : vue.createCommentVNode("v-if", true),
                        index2 == 3 ? (vue.openBlock(true), vue.createElementBlock(
                          vue.Fragment,
                          { key: 3 },
                          vue.renderList(vue.unref(cateProduct3), (item2, index22) => {
                            return vue.openBlock(), vue.createElementBlock("navigator", {
                              key: index22,
                              url: `/pages/detail/detail?id=${item2.Id}`,
                              role: "navigation",
                              class: "item"
                            }, [
                              vue.createElementVNode("image", {
                                "lazy-load": "true",
                                src: item2.Picture.NormalUrl
                              }, null, 8, ["src"]),
                              vue.createElementVNode(
                                "view",
                                { class: "text" },
                                vue.toDisplayString(item2.Name),
                                1
                                /* TEXT */
                              )
                            ], 8, ["url"]);
                          }),
                          128
                          /* KEYED_FRAGMENT */
                        )) : vue.createCommentVNode("v-if", true)
                      ])) : vue.createCommentVNode("v-if", true),
                      index2 !== 4 && vue.unref(selected) == index2 ? (vue.openBlock(), vue.createElementBlock("view", {
                        key: 1,
                        class: "more"
                      }, [
                        index2 == 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                          key: 0,
                          style: { "text-align": "center", "padding": "10rpx", "color": "#3d3d3d" }
                        }, [
                          vue.createElementVNode("navigator", {
                            url: "/pages/subcategory/subcategory?id=103",
                            role: "navigation"
                          }, "查看更多")
                        ])) : vue.createCommentVNode("v-if", true),
                        index2 == 2 ? (vue.openBlock(), vue.createElementBlock("view", {
                          key: 1,
                          style: { "text-align": "center", "padding": "10rpx", "color": "#3d3d3d" }
                        }, [
                          vue.createElementVNode("navigator", {
                            url: "/pages/subcategory/subcategory?id=244",
                            role: "navigation"
                          }, "查看更多")
                        ])) : vue.createCommentVNode("v-if", true)
                      ])) : vue.createCommentVNode("v-if", true)
                    ],
                    64
                    /* STABLE_FRAGMENT */
                  );
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ])
        ]);
      };
    }
  };
  const PagesCategoryCategory = /* @__PURE__ */ _export_sfc(_sfc_main$o, [["__scopeId", "data-v-8145b772"], ["__file", "E:/Uni-App/urshop/pages/category/category.vue"]]);
  const props$a = {
    props: {
      // 是否展示组件
      show: {
        type: Boolean,
        default: props$g.transition.show
      },
      // 使用的动画模式
      mode: {
        type: String,
        default: props$g.transition.mode
      },
      // 动画的执行时间，单位ms
      duration: {
        type: [String, Number],
        default: props$g.transition.duration
      },
      // 使用的动画过渡函数
      timingFunction: {
        type: String,
        default: props$g.transition.timingFunction
      }
    }
  };
  const getClassNames = (name) => ({
    enter: `u-${name}-enter u-${name}-enter-active`,
    "enter-to": `u-${name}-enter-to u-${name}-enter-active`,
    leave: `u-${name}-leave u-${name}-leave-active`,
    "leave-to": `u-${name}-leave-to u-${name}-leave-active`
  });
  const transition = {
    methods: {
      // 组件被点击发出事件
      clickHandler() {
        this.$emit("click");
      },
      // vue版本的组件进场处理
      vueEnter() {
        const classNames = getClassNames(this.mode);
        this.status = "enter";
        this.$emit("beforeEnter");
        this.inited = true;
        this.display = true;
        this.classes = classNames.enter;
        this.$nextTick(async () => {
          this.$emit("enter");
          this.transitionEnded = false;
          this.$emit("afterEnter");
          this.classes = classNames["enter-to"];
        });
      },
      // 动画离场处理
      vueLeave() {
        if (!this.display)
          return;
        const classNames = getClassNames(this.mode);
        this.status = "leave";
        this.$emit("beforeLeave");
        this.classes = classNames.leave;
        this.$nextTick(() => {
          this.transitionEnded = false;
          this.$emit("leave");
          setTimeout(this.onTransitionEnd, this.duration);
          this.classes = classNames["leave-to"];
        });
      },
      // 完成过渡后触发
      onTransitionEnd() {
        if (this.transitionEnded)
          return;
        this.transitionEnded = true;
        this.$emit(this.status === "leave" ? "afterLeave" : "afterEnter");
        if (!this.show && this.display) {
          this.display = false;
          this.inited = false;
        }
      }
    }
  };
  const _sfc_main$n = {
    name: "u-transition",
    data() {
      return {
        inited: false,
        // 是否显示/隐藏组件
        viewStyle: {},
        // 组件内部的样式
        status: "",
        // 记录组件动画的状态
        transitionEnded: false,
        // 组件是否结束的标记
        display: false,
        // 组件是否展示
        classes: ""
        // 应用的类名
      };
    },
    computed: {
      mergeStyle() {
        const { viewStyle, customStyle } = this;
        return {
          transitionDuration: `${this.duration}ms`,
          // display: `${this.display ? '' : 'none'}`,
          transitionTimingFunction: this.timingFunction,
          // 避免自定义样式影响到动画属性，所以写在viewStyle前面
          ...uni.$u.addStyle(customStyle),
          ...viewStyle
        };
      }
    },
    // 将mixin挂在到组件中，uni.$u.mixin实际上为一个vue格式对象
    mixins: [mpMixin, mixin, transition, props$a],
    watch: {
      show: {
        handler(newVal) {
          newVal ? this.vueEnter() : this.vueLeave();
        },
        // 表示同时监听初始化时的props的show的意思
        immediate: true
      }
    }
  };
  function _sfc_render$c(_ctx, _cache, $props, $setup, $data, $options) {
    return $data.inited ? (vue.openBlock(), vue.createElementBlock(
      "view",
      {
        key: 0,
        class: vue.normalizeClass(["u-transition", $data.classes]),
        ref: "u-transition",
        onClick: _cache[0] || (_cache[0] = (...args) => _ctx.clickHandler && _ctx.clickHandler(...args)),
        style: vue.normalizeStyle([$options.mergeStyle]),
        onTouchmove: _cache[1] || (_cache[1] = (...args) => _ctx.noop && _ctx.noop(...args))
      },
      [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ],
      38
      /* CLASS, STYLE, HYDRATE_EVENTS */
    )) : vue.createCommentVNode("v-if", true);
  }
  const __easycom_4 = /* @__PURE__ */ _export_sfc(_sfc_main$n, [["render", _sfc_render$c], ["__scopeId", "data-v-5cec8177"], ["__file", "E:/Uni-App/urshop/uni_modules/uview-plus/components/u-transition/u-transition.vue"]]);
  const props$9 = {
    props: {
      // 图片地址
      src: {
        type: String,
        default: props$g.image.src
      },
      // 裁剪模式
      mode: {
        type: String,
        default: props$g.image.mode
      },
      // 宽度，单位任意
      width: {
        type: [String, Number],
        default: props$g.image.width
      },
      // 高度，单位任意
      height: {
        type: [String, Number],
        default: props$g.image.height
      },
      // 图片形状，circle-圆形，square-方形
      shape: {
        type: String,
        default: props$g.image.shape
      },
      // 圆角，单位任意
      radius: {
        type: [String, Number],
        default: props$g.image.radius
      },
      // 是否懒加载，微信小程序、App、百度小程序、字节跳动小程序
      lazyLoad: {
        type: Boolean,
        default: props$g.image.lazyLoad
      },
      // 开启长按图片显示识别微信小程序码菜单
      showMenuByLongpress: {
        type: Boolean,
        default: props$g.image.showMenuByLongpress
      },
      // 加载中的图标，或者小图片
      loadingIcon: {
        type: String,
        default: props$g.image.loadingIcon
      },
      // 加载失败的图标，或者小图片
      errorIcon: {
        type: String,
        default: props$g.image.errorIcon
      },
      // 是否显示加载中的图标或者自定义的slot
      showLoading: {
        type: Boolean,
        default: props$g.image.showLoading
      },
      // 是否显示加载错误的图标或者自定义的slot
      showError: {
        type: Boolean,
        default: props$g.image.showError
      },
      // 是否需要淡入效果
      fade: {
        type: Boolean,
        default: props$g.image.fade
      },
      // 只支持网络资源，只对微信小程序有效
      webp: {
        type: Boolean,
        default: props$g.image.webp
      },
      // 过渡时间，单位ms
      duration: {
        type: [String, Number],
        default: props$g.image.duration
      },
      // 背景颜色，用于深色页面加载图片时，为了和背景色融合
      bgColor: {
        type: String,
        default: props$g.image.bgColor
      }
    }
  };
  const _sfc_main$m = {
    name: "u-image",
    mixins: [mpMixin, mixin, props$9],
    data() {
      return {
        // 图片是否加载错误，如果是，则显示错误占位图
        isError: false,
        // 初始化组件时，默认为加载中状态
        loading: true,
        // 不透明度，为了实现淡入淡出的效果
        opacity: 1,
        // 过渡时间，因为props的值无法修改，故需要一个中间值
        durationTime: this.duration,
        // 图片加载完成时，去掉背景颜色，因为如果是png图片，就会显示灰色的背景
        backgroundStyle: {},
        // 用于fade模式的控制组件显示与否
        show: false
      };
    },
    watch: {
      src: {
        immediate: true,
        handler(n2) {
          if (!n2) {
            this.isError = true;
          } else {
            this.isError = false;
            this.loading = true;
          }
        }
      }
    },
    computed: {
      wrapStyle() {
        let style = {};
        style.width = this.$u.addUnit(this.width);
        style.height = this.$u.addUnit(this.height);
        style.borderRadius = this.shape == "circle" ? "10000px" : uni.$u.addUnit(this.radius);
        style.overflow = this.radius > 0 ? "hidden" : "visible";
        return uni.$u.deepMerge(style, uni.$u.addStyle(this.customStyle));
      }
    },
    mounted() {
      this.show = true;
    },
    emits: ["click", "error", "load"],
    methods: {
      // 点击图片
      onClick() {
        this.$emit("click");
      },
      // 图片加载失败
      onErrorHandler(err) {
        this.loading = false;
        this.isError = true;
        this.$emit("error", err);
      },
      // 图片加载完成，标记loading结束
      onLoadHandler(event) {
        this.loading = false;
        this.isError = false;
        this.$emit("load", event);
        this.removeBgColor();
      },
      // 移除图片的背景色
      removeBgColor() {
        this.backgroundStyle = {
          backgroundColor: "transparent"
        };
      }
    }
  };
  function _sfc_render$b(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$8);
    const _component_u_transition = resolveEasycom(vue.resolveDynamicComponent("u-transition"), __easycom_4);
    return vue.openBlock(), vue.createBlock(_component_u_transition, {
      mode: "fade",
      show: $data.show,
      duration: _ctx.fade ? 1e3 : 0
    }, {
      default: vue.withCtx(() => [
        vue.createElementVNode(
          "view",
          {
            class: "u-image",
            onClick: _cache[2] || (_cache[2] = (...args) => $options.onClick && $options.onClick(...args)),
            style: vue.normalizeStyle([$options.wrapStyle, $data.backgroundStyle])
          },
          [
            !$data.isError ? (vue.openBlock(), vue.createElementBlock("image", {
              key: 0,
              src: _ctx.src,
              mode: _ctx.mode,
              onError: _cache[0] || (_cache[0] = (...args) => $options.onErrorHandler && $options.onErrorHandler(...args)),
              onLoad: _cache[1] || (_cache[1] = (...args) => $options.onLoadHandler && $options.onLoadHandler(...args)),
              "show-menu-by-longpress": _ctx.showMenuByLongpress,
              "lazy-load": _ctx.lazyLoad,
              class: "u-image__image",
              style: vue.normalizeStyle({
                borderRadius: _ctx.shape == "circle" ? "10000px" : _ctx.$u.addUnit(_ctx.radius),
                width: _ctx.$u.addUnit(_ctx.width),
                height: _ctx.$u.addUnit(_ctx.height)
              })
            }, null, 44, ["src", "mode", "show-menu-by-longpress", "lazy-load"])) : vue.createCommentVNode("v-if", true),
            _ctx.showLoading && $data.loading ? (vue.openBlock(), vue.createElementBlock(
              "view",
              {
                key: 1,
                class: "u-image__loading",
                style: vue.normalizeStyle({
                  borderRadius: _ctx.shape == "circle" ? "50%" : _ctx.$u.addUnit(_ctx.radius),
                  backgroundColor: this.bgColor,
                  width: _ctx.$u.addUnit(_ctx.width),
                  height: _ctx.$u.addUnit(_ctx.height)
                })
              },
              [
                vue.renderSlot(_ctx.$slots, "loading", {}, () => [
                  vue.createVNode(_component_u_icon, {
                    name: _ctx.loadingIcon,
                    width: _ctx.width,
                    height: _ctx.height
                  }, null, 8, ["name", "width", "height"])
                ], true)
              ],
              4
              /* STYLE */
            )) : vue.createCommentVNode("v-if", true),
            _ctx.showError && $data.isError && !$data.loading ? (vue.openBlock(), vue.createElementBlock(
              "view",
              {
                key: 2,
                class: "u-image__error",
                style: vue.normalizeStyle({
                  borderRadius: _ctx.shape == "circle" ? "50%" : _ctx.$u.addUnit(_ctx.radius),
                  width: _ctx.$u.addUnit(_ctx.width),
                  height: _ctx.$u.addUnit(_ctx.height)
                })
              },
              [
                vue.renderSlot(_ctx.$slots, "error", {}, () => [
                  vue.createVNode(_component_u_icon, {
                    name: _ctx.errorIcon,
                    width: _ctx.width,
                    height: _ctx.height
                  }, null, 8, ["name", "width", "height"])
                ], true)
              ],
              4
              /* STYLE */
            )) : vue.createCommentVNode("v-if", true)
          ],
          4
          /* STYLE */
        )
      ]),
      _: 3
      /* FORWARDED */
    }, 8, ["show", "duration"]);
  }
  const uvImage = /* @__PURE__ */ _export_sfc(_sfc_main$m, [["render", _sfc_render$b], ["__scopeId", "data-v-abebd402"], ["__file", "E:/Uni-App/urshop/uni_modules/uview-plus/components/u-image/u-image.vue"]]);
  const _sfc_main$l = {
    name: "u--image",
    mixins: [mpMixin, props$9, mixin],
    components: {
      uvImage
    },
    emits: ["click", "error", "load"]
  };
  function _sfc_render$a(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_uvImage = vue.resolveComponent("uvImage");
    return vue.openBlock(), vue.createBlock(_component_uvImage, {
      src: _ctx.src,
      mode: _ctx.mode,
      width: _ctx.width,
      height: _ctx.height,
      shape: _ctx.shape,
      radius: _ctx.radius,
      lazyLoad: _ctx.lazyLoad,
      showMenuByLongpress: _ctx.showMenuByLongpress,
      loadingIcon: _ctx.loadingIcon,
      errorIcon: _ctx.errorIcon,
      showLoading: _ctx.showLoading,
      showError: _ctx.showError,
      fade: _ctx.fade,
      webp: _ctx.webp,
      duration: _ctx.duration,
      bgColor: _ctx.bgColor,
      customStyle: _ctx.customStyle,
      onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("click")),
      onError: _cache[1] || (_cache[1] = ($event) => _ctx.$emit("error")),
      onLoad: _cache[2] || (_cache[2] = ($event) => _ctx.$emit("load"))
    }, {
      loading: vue.withCtx(() => [
        vue.renderSlot(_ctx.$slots, "loading")
      ]),
      error: vue.withCtx(() => [
        vue.renderSlot(_ctx.$slots, "error")
      ]),
      _: 3
      /* FORWARDED */
    }, 8, ["src", "mode", "width", "height", "shape", "radius", "lazyLoad", "showMenuByLongpress", "loadingIcon", "errorIcon", "showLoading", "showError", "fade", "webp", "duration", "bgColor", "customStyle"]);
  }
  const __easycom_2$1 = /* @__PURE__ */ _export_sfc(_sfc_main$l, [["render", _sfc_render$a], ["__file", "E:/Uni-App/urshop/uni_modules/uview-plus/components/u--image/u--image.vue"]]);
  const _sfc_main$k = {
    __name: "cart",
    setup(__props) {
      const gocategory = (e) => {
        uni.switchTab({
          url: "../category/category"
        });
      };
      let cartList = vue.ref([]);
      let allChecked = vue.ref(false);
      let totalPrice = vue.ref(0);
      let totalNum = vue.ref(0);
      const handleItemAllCheck = (e) => {
        allChecked.value = !allChecked.value;
        cartList.value.forEach((item) => {
          item.checked = allChecked.value;
        });
        formatAppLog("log", "at pages/cart/cart.vue:86", allChecked.value);
        gettotal(cartList.value);
      };
      const handleItemChange = (index2) => {
        cartList.value[index2].checked = !cartList.value[index2].checked;
        let i2 = cartList.value.findIndex((item) => item.checked === false);
        if (i2 == -1) {
          allChecked.value = true;
        } else {
          allChecked.value = false;
        }
        gettotal(cartList.value);
      };
      const editor = (choose, index2) => {
        if (choose == 0) {
          cartList.value[index2].num++;
        } else {
          cartList.value[index2].num--;
          if (cartList.value[index2].num == 0) {
            cartList.value.splice(index2, 1);
          }
        }
        uni.setStorageSync("cart", cartList.value);
        gettotal(cartList.value);
      };
      const gettotal = (cartList2) => {
        totalNum.value = 0;
        totalPrice.value = 0;
        cartList2.forEach((item) => {
          if (item.checked == true) {
            totalNum.value += item.num;
            let price = item.Price;
            price = parseFloat(price.replace("¥", ""));
            totalPrice.value += item.num * price;
          }
        });
        totalPrice.value = totalPrice.value.toFixed(2);
      };
      onShow(() => {
        cartList.value = uni.getStorageSync("cart");
        formatAppLog("log", "at pages/cart/cart.vue:138", cartList.value);
        let i2 = cartList.value.findIndex((item) => item.checked === false);
        if (i2 == -1) {
          allChecked.value = true;
        } else {
          allChecked.value = false;
        }
        gettotal(cartList.value);
      });
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$8);
        const _component_u_button = resolveEasycom(vue.resolveDynamicComponent("u-button"), __easycom_0$5);
        const _component_u__image = resolveEasycom(vue.resolveDynamicComponent("u--image"), __easycom_2$1);
        return vue.openBlock(), vue.createElementBlock("view", { class: "cart" }, [
          vue.unref(cartList).length == 0 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "empty"
          }, [
            vue.createVNode(_component_u_icon, {
              color: "#ccc",
              size: "200",
              name: "shopping-cart"
            }),
            vue.createElementVNode("view", { class: "text" }, [
              vue.createElementVNode("text", null, "购物车还是空的"),
              vue.createVNode(_component_u_button, {
                onClick: gocategory,
                color: "#950000",
                text: "去逛逛"
              })
            ])
          ])) : (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "container"
          }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(vue.unref(cartList), (item, index2) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "cart_item",
                  key: index2
                }, [
                  vue.createCommentVNode(" 复选框 "),
                  vue.createElementVNode("view", { class: "cart_chk_wrap" }, [
                    vue.createElementVNode("checkbox-group", {
                      onChange: ($event) => handleItemChange(index2)
                    }, [
                      vue.createElementVNode("checkbox", {
                        checked: item.checked
                      }, null, 8, ["checked"])
                    ], 40, ["onChange"])
                  ]),
                  vue.createCommentVNode(" 图片 "),
                  vue.createElementVNode("navigator", {
                    class: "cart_image_wrap",
                    url: `/pages/detail/detail?id=${item.Id}`
                  }, [
                    vue.createCommentVNode(' <image  :src="item.Pictures[0].BigUrl"></image> '),
                    vue.createVNode(_component_u__image, {
                      showLoading: true,
                      src: item.Pictures[0].BigUrl,
                      width: "180rpx",
                      height: "180rpx"
                    }, null, 8, ["src"])
                  ], 8, ["url"]),
                  vue.createCommentVNode(" 文字介绍、单价 "),
                  vue.createElementVNode("view", { class: "cart_info_wrap" }, [
                    vue.createElementVNode(
                      "view",
                      { class: "goods_name" },
                      vue.toDisplayString(item.Name),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode("view", { class: "goods_price_wrap" }, [
                      vue.createElementVNode(
                        "view",
                        { class: "goods_price" },
                        vue.toDisplayString(item.Price),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode("view", { class: "cart_num_tool" }, [
                        vue.createElementVNode("view", {
                          onClick: ($event) => editor(1, index2),
                          class: "num_edit"
                        }, "-", 8, ["onClick"]),
                        vue.createElementVNode(
                          "view",
                          { class: "goods_num" },
                          vue.toDisplayString(item.num),
                          1
                          /* TEXT */
                        ),
                        vue.createElementVNode("view", {
                          onClick: ($event) => editor(0, index2),
                          class: "num_edit"
                        }, "+", 8, ["onClick"])
                      ])
                    ])
                  ]),
                  vue.createCommentVNode(" 商品数量 ")
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])),
          vue.createCommentVNode(" 底部工具栏 "),
          vue.createElementVNode("view", { class: "footer_tool" }, [
            vue.createCommentVNode(" 全选 "),
            vue.createElementVNode("view", { class: "all_chk_wrap" }, [
              vue.createElementVNode(
                "checkbox-group",
                { onChange: handleItemAllCheck },
                [
                  vue.createElementVNode("checkbox", { checked: vue.unref(allChecked) }, "全选", 8, ["checked"])
                ],
                32
                /* HYDRATE_EVENTS */
              )
            ]),
            vue.createCommentVNode(" 总价格 "),
            vue.createElementVNode("view", { class: "total_price_wrap" }, [
              vue.createElementVNode("view", { class: "total_price" }, [
                vue.createTextVNode(" 合计："),
                vue.createElementVNode(
                  "text",
                  { class: "total_price_text" },
                  vue.toDisplayString(vue.unref(totalPrice)),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", null, "包含运费")
            ]),
            vue.createCommentVNode(" 结算 "),
            vue.createElementVNode(
              "view",
              {
                class: "order_pay_wrap",
                bindtap: "handlePay"
              },
              " 结算（" + vue.toDisplayString(vue.unref(totalNum)) + "） ",
              1
              /* TEXT */
            )
          ])
        ]);
      };
    }
  };
  const PagesCartCart = /* @__PURE__ */ _export_sfc(_sfc_main$k, [["__file", "E:/Uni-App/urshop/pages/cart/cart.vue"]]);
  const _sfc_main$j = {
    __name: "mine",
    setup(__props) {
      let username = vue.ref("11");
      let bannerList2 = vue.ref([]);
      let item1 = () => {
        uni.showModal({
          title: "提示",
          content: "审核中",
          success: function(res) {
            if (res.confirm) {
              formatAppLog("log", "at pages/mine/mine.vue:113", "用户点击确定");
            } else if (res.cancel) {
              formatAppLog("log", "at pages/mine/mine.vue:115", "用户点击取消");
            }
          }
        });
      };
      let nav = (name) => {
        switch (name) {
          case "order":
            formatAppLog("log", "at pages/mine/mine.vue:123", "order");
            uni.navigateTo({
              url: "../order/order"
            });
            break;
          case "orderList":
            formatAppLog("log", "at pages/mine/mine.vue:129", "orderList");
            uni.navigateTo({
              url: "../orderList/orderList"
            });
            break;
          case "address":
            formatAppLog("log", "at pages/mine/mine.vue:135", "address");
            uni.navigateTo({
              url: "../address/address"
            });
            break;
          case "question":
            formatAppLog("log", "at pages/mine/mine.vue:141", "question");
            uni.navigateTo({
              url: "../question/question?name=aboutus"
            });
            break;
          case "question2":
            uni.navigateTo({
              url: "../question/question?name=serviceProtocol"
            });
            formatAppLog("log", "at pages/mine/mine.vue:150", "question2");
            break;
        }
      };
      onLoad(async () => {
        const res = await getABannerList2({ name: "homehotbanner-second-mobile" });
        bannerList2.value = res.Data.Items;
        formatAppLog("log", "at pages/mine/mine.vue:159", bannerList2.value);
      });
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$8);
        return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
          vue.createElementVNode("view", { class: "userinfo" }, [
            vue.createElementVNode("view", { class: "user-img" }, [
              vue.createElementVNode("image", { src: "/static/images/logo.png" })
            ]),
            vue.createElementVNode("view", { class: "userinfo-nickname" }, [
              vue.createElementVNode(
                "text",
                { class: "user-name" },
                vue.toDisplayString(vue.unref(username)),
                1
                /* TEXT */
              ),
              vue.createElementVNode("view", { class: "bindphone-box" }, [
                vue.createElementVNode("text", { class: "bindPhone" }, "绑定手机号")
              ])
            ])
          ]),
          vue.createElementVNode("view", { class: "con" }, [
            vue.createElementVNode("view", {
              class: "item",
              onClick: _cache[0] || (_cache[0] = (...args) => vue.unref(item1) && vue.unref(item1)(...args))
            }, [
              vue.createElementVNode("view", { class: "item-1" }, [
                vue.createVNode(_component_u_icon, {
                  size: "40",
                  name: "man-add"
                })
              ]),
              vue.createElementVNode("view", { class: "item-2" }, " 成为合伙人 "),
              vue.createElementVNode("view", { class: "item-3" }, [
                vue.createVNode(_component_u_icon, {
                  color: "#ccc",
                  size: "40",
                  name: "arrow-right"
                })
              ])
            ]),
            vue.createElementVNode("view", {
              class: "item",
              onClick: _cache[1] || (_cache[1] = ($event) => vue.unref(nav)("order"))
            }, [
              vue.createElementVNode("view", { class: "item-1" }, [
                vue.createVNode(_component_u_icon, {
                  size: "40",
                  name: "file-text-fill"
                })
              ]),
              vue.createElementVNode("view", { class: "item-2" }, " 我的订单 "),
              vue.createElementVNode("view", { class: "item-3" }, [
                vue.createVNode(_component_u_icon, {
                  color: "#ccc",
                  size: "40",
                  name: "arrow-right"
                })
              ])
            ]),
            vue.createElementVNode("view", {
              class: "item",
              onClick: _cache[2] || (_cache[2] = ($event) => vue.unref(nav)("orderList"))
            }, [
              vue.createElementVNode("view", { class: "item-1" }, [
                vue.createVNode(_component_u_icon, {
                  size: "40",
                  name: "question-circle"
                })
              ]),
              vue.createElementVNode("view", { class: "item-2" }, " 退款售后 "),
              vue.createElementVNode("view", { class: "item-3" }, [
                vue.createVNode(_component_u_icon, {
                  color: "#ccc",
                  size: "40",
                  name: "arrow-right"
                })
              ])
            ]),
            vue.createElementVNode("view", {
              class: "item",
              onClick: _cache[3] || (_cache[3] = ($event) => vue.unref(nav)("address"))
            }, [
              vue.createElementVNode("view", { class: "item-1" }, [
                vue.createVNode(_component_u_icon, {
                  size: "40",
                  name: "map-fill"
                })
              ]),
              vue.createElementVNode("view", { class: "item-2" }, " 收货地址 "),
              vue.createElementVNode("view", { class: "item-3" }, [
                vue.createVNode(_component_u_icon, {
                  color: "#ccc",
                  size: "40",
                  name: "arrow-right"
                })
              ])
            ]),
            vue.createElementVNode("view", { class: "item" }, [
              vue.createElementVNode("view", { class: "item-1" }, [
                vue.createVNode(_component_u_icon, {
                  size: "40",
                  name: "server-man"
                })
              ]),
              vue.createElementVNode("view", { class: "item-2" }, " 联系客服 "),
              vue.createElementVNode("view", { class: "item-3" }, [
                vue.createVNode(_component_u_icon, {
                  color: "#ccc",
                  size: "40",
                  name: "arrow-right"
                })
              ])
            ]),
            vue.createElementVNode("view", {
              class: "item",
              onClick: _cache[4] || (_cache[4] = ($event) => vue.unref(nav)("question"))
            }, [
              vue.createElementVNode("view", { class: "item-1" }, [
                vue.createVNode(_component_u_icon, {
                  size: "40",
                  name: "info-circle-fill"
                })
              ]),
              vue.createElementVNode("view", { class: "item-2" }, " 关于我们 "),
              vue.createElementVNode("view", { class: "item-3" }, [
                vue.createVNode(_component_u_icon, {
                  color: "#ccc",
                  size: "40",
                  name: "arrow-right"
                })
              ])
            ]),
            vue.createElementVNode("view", {
              class: "item",
              onClick: _cache[5] || (_cache[5] = ($event) => vue.unref(nav)("question2"))
            }, [
              vue.createElementVNode("view", { class: "item-1" }, [
                vue.createVNode(_component_u_icon, {
                  size: "40",
                  name: "info-circle-fill"
                })
              ]),
              vue.createElementVNode("view", { class: "item-2" }, " 购买须知 "),
              vue.createElementVNode("view", { class: "item-3" }, [
                vue.createVNode(_component_u_icon, {
                  color: "#ccc",
                  size: "40",
                  name: "arrow-right"
                })
              ])
            ])
          ]),
          vue.unref(bannerList2).length !== 0 ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "banner"
          }, [
            vue.createElementVNode("navigator", {
              url: vue.unref(bannerList2)[0].Url
            }, [
              vue.createElementVNode("image", {
                src: vue.unref(bannerList2)[0].Picture.BigUrl
              }, null, 8, ["src"])
            ], 8, ["url"])
          ])) : vue.createCommentVNode("v-if", true)
        ]);
      };
    }
  };
  const PagesMineMine = /* @__PURE__ */ _export_sfc(_sfc_main$j, [["__file", "E:/Uni-App/urshop/pages/mine/mine.vue"]]);
  const _sfc_main$i = {
    __name: "options",
    setup(__props) {
      const currentAdres = vue.ref({
        Name: "新地区",
        Address: ""
      });
      const AdresList = vue.ref([]);
      vue.ref([]);
      const searchList = vue.ref([]);
      vue.ref(false);
      const searchPage = vue.ref(false);
      vue.ref(false);
      const search = (e) => {
        formatAppLog("log", "at pages/options/options.vue:53", e);
      };
      return (_ctx, _cache) => {
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$8);
        const _component_u_search = resolveEasycom(vue.resolveDynamicComponent("u-search"), __easycom_0$4);
        return vue.openBlock(), vue.createElementBlock("view", { class: "container" }, [
          vue.createElementVNode("view", { class: "options-box" }, [
            vue.createElementVNode("text", { class: "option-title" }, "当前"),
            vue.createElementVNode(
              "text",
              { class: "option-adres" },
              "分店：" + vue.toDisplayString(currentAdres.value.Name),
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "text",
              { class: "option-info" },
              "分店地址：" + vue.toDisplayString(currentAdres.value.Address),
              1
              /* TEXT */
            ),
            vue.createVNode(_component_u_icon, {
              class: "right",
              name: "checkmark",
              size: "50rpx",
              color: "#fff"
            })
          ]),
          vue.createElementVNode("view", { class: "options-box" }, [
            vue.createElementVNode("text", { class: "option-title" }, "搜索"),
            vue.createVNode(_component_u_search, {
              onSearch: search,
              bgColor: "#f5f5f5",
              "show-action": false,
              clearabled: true,
              shape: "round",
              placeholder: "搜一搜"
            })
          ]),
          !searchPage.value ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "options-box"
          }, [
            vue.createElementVNode("text", { class: "option-title" }, "附近"),
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(AdresList.value, (item, index2) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "marb",
                  key: index2
                }, [
                  vue.createElementVNode(
                    "text",
                    { class: "option-adres" },
                    "分店：" + vue.toDisplayString(item.adres.Name),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "option-info" },
                    "分店地址：" + vue.toDisplayString(item.adres.Address),
                    1
                    /* TEXT */
                  ),
                  item.distance < 1e3 ? (vue.openBlock(), vue.createElementBlock(
                    "text",
                    {
                      key: 0,
                      class: "distance"
                    },
                    vue.toDisplayString(item.distance) + "M",
                    1
                    /* TEXT */
                  )) : vue.createCommentVNode("v-if", true),
                  item.distance >= 1e3 ? (vue.openBlock(), vue.createElementBlock(
                    "text",
                    {
                      key: 1,
                      class: "distance"
                    },
                    vue.toDisplayString(item.distance / 1e3 | _ctx.Int) + "KM",
                    1
                    /* TEXT */
                  )) : vue.createCommentVNode("v-if", true)
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])) : vue.createCommentVNode("v-if", true),
          searchPage.value ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "options-box"
          }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList(searchList.value, (item, index2) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "marb",
                  key: index2
                }, [
                  vue.createElementVNode(
                    "text",
                    { class: "option-adres" },
                    "分店：" + vue.toDisplayString(item.adres.Name),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "option-info" },
                    "分店地址：" + vue.toDisplayString(item.adres.Address),
                    1
                    /* TEXT */
                  ),
                  item.distance < 1e3 ? (vue.openBlock(), vue.createElementBlock(
                    "text",
                    {
                      key: 0,
                      class: "distance"
                    },
                    vue.toDisplayString(item.distance) + "M",
                    1
                    /* TEXT */
                  )) : vue.createCommentVNode("v-if", true),
                  item.distance >= 1e3 ? (vue.openBlock(), vue.createElementBlock(
                    "text",
                    {
                      key: 1,
                      class: "distance"
                    },
                    vue.toDisplayString(item.distance / 1e3 | _ctx.Int) + "KM",
                    1
                    /* TEXT */
                  )) : vue.createCommentVNode("v-if", true)
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            )),
            !searchList.value.length ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "hide-no"
            }, [
              vue.createElementVNode("text", null, "您搜索的分店暂未开通")
            ])) : vue.createCommentVNode("v-if", true)
          ])) : vue.createCommentVNode("v-if", true)
        ]);
      };
    }
  };
  const PagesOptionsOptions = /* @__PURE__ */ _export_sfc(_sfc_main$i, [["__file", "E:/Uni-App/urshop/pages/options/options.vue"]]);
  const props$8 = {
    props: {
      // 是否显示圆点
      isDot: {
        type: Boolean,
        default: props$g.badge.isDot
      },
      // 显示的内容
      value: {
        type: [Number, String],
        default: props$g.badge.value
      },
      // 显示的内容
      modelValue: {
        type: [Number, String],
        default: props$g.badge.modelValue
      },
      // 是否显示
      show: {
        type: Boolean,
        default: props$g.badge.show
      },
      // 最大值，超过最大值会显示 '{max}+'
      max: {
        type: [Number, String],
        default: props$g.badge.max
      },
      // 主题类型，error|warning|success|primary
      type: {
        type: String,
        default: props$g.badge.type
      },
      // 当数值为 0 时，是否展示 Badge
      showZero: {
        type: Boolean,
        default: props$g.badge.showZero
      },
      // 背景颜色，优先级比type高，如设置，type参数会失效
      bgColor: {
        type: [String, null],
        default: props$g.badge.bgColor
      },
      // 字体颜色
      color: {
        type: [String, null],
        default: props$g.badge.color
      },
      // 徽标形状，circle-四角均为圆角，horn-左下角为直角
      shape: {
        type: String,
        default: props$g.badge.shape
      },
      // 设置数字的显示方式，overflow|ellipsis|limit
      // overflow会根据max字段判断，超出显示`${max}+`
      // ellipsis会根据max判断，超出显示`${max}...`
      // limit会依据1000作为判断条件，超出1000，显示`${value/1000}K`，比如2.2k、3.34w，最多保留2位小数
      numberType: {
        type: String,
        default: props$g.badge.numberType
      },
      // 设置badge的位置偏移，格式为 [x, y]，也即设置的为top和right的值，absolute为true时有效
      offset: {
        type: Array,
        default: props$g.badge.offset
      },
      // 是否反转背景和字体颜色
      inverted: {
        type: Boolean,
        default: props$g.badge.inverted
      },
      // 是否绝对定位
      absolute: {
        type: Boolean,
        default: props$g.badge.absolute
      }
    }
  };
  const _sfc_main$h = {
    name: "u-badge",
    mixins: [mpMixin, props$8, mixin],
    computed: {
      // 是否将badge中心与父组件右上角重合
      boxStyle() {
        let style = {};
        return style;
      },
      // 整个组件的样式
      badgeStyle() {
        const style = {};
        if (this.color) {
          style.color = this.color;
        }
        if (this.bgColor && !this.inverted) {
          style.backgroundColor = this.bgColor;
        }
        if (this.absolute) {
          style.position = "absolute";
          if (this.offset.length) {
            const top = this.offset[0];
            const right = this.offset[1] || top;
            style.top = uni.$u.addUnit(top);
            style.right = uni.$u.addUnit(right);
          }
        }
        return style;
      },
      showValue() {
        switch (this.numberType) {
          case "overflow":
            return Number(this.value) > Number(this.max) ? this.max + "+" : this.value;
          case "ellipsis":
            return Number(this.value) > Number(this.max) ? "..." : this.value;
          case "limit":
            return Number(this.value) > 999 ? Number(this.value) >= 9999 ? Math.floor(this.value / 1e4 * 100) / 100 + "w" : Math.floor(this.value / 1e3 * 100) / 100 + "k" : this.value;
          default:
            return Number(this.value);
        }
      }
    }
  };
  function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
    return _ctx.show && ((Number(_ctx.value) === 0 ? _ctx.showZero : true) || _ctx.isDot) ? (vue.openBlock(), vue.createElementBlock(
      "text",
      {
        key: 0,
        class: vue.normalizeClass([[_ctx.isDot ? "u-badge--dot" : "u-badge--not-dot", _ctx.inverted && "u-badge--inverted", _ctx.shape === "horn" && "u-badge--horn", `u-badge--${_ctx.type}${_ctx.inverted ? "--inverted" : ""}`], "u-badge"]),
        style: vue.normalizeStyle([_ctx.$u.addStyle(_ctx.customStyle), $options.badgeStyle])
      },
      vue.toDisplayString(_ctx.isDot ? "" : $options.showValue),
      7
      /* TEXT, CLASS, STYLE */
    )) : vue.createCommentVNode("v-if", true);
  }
  const __easycom_0$3 = /* @__PURE__ */ _export_sfc(_sfc_main$h, [["render", _sfc_render$9], ["__scopeId", "data-v-06cca9b7"], ["__file", "E:/Uni-App/urshop/uni_modules/uview-plus/components/u-badge/u-badge.vue"]]);
  const props$7 = {
    props: {
      // 滑块的移动过渡时间，单位ms
      duration: {
        type: Number,
        default: props$g.tabs.duration
      },
      // tabs标签数组
      list: {
        type: Array,
        default: props$g.tabs.list
      },
      // 滑块颜色
      lineColor: {
        type: String,
        default: props$g.tabs.lineColor
      },
      // 菜单选择中时的样式
      activeStyle: {
        type: [String, Object],
        default: props$g.tabs.activeStyle
      },
      // 菜单非选中时的样式
      inactiveStyle: {
        type: [String, Object],
        default: props$g.tabs.inactiveStyle
      },
      // 滑块长度
      lineWidth: {
        type: [String, Number],
        default: props$g.tabs.lineWidth
      },
      // 滑块高度
      lineHeight: {
        type: [String, Number],
        default: props$g.tabs.lineHeight
      },
      // 滑块背景显示大小，当滑块背景设置为图片时使用
      lineBgSize: {
        type: String,
        default: props$g.tabs.lineBgSize
      },
      // 菜单item的样式
      itemStyle: {
        type: [String, Object],
        default: props$g.tabs.itemStyle
      },
      // 菜单是否可滚动
      scrollable: {
        type: Boolean,
        default: props$g.tabs.scrollable
      },
      // 当前选中标签的索引
      current: {
        type: [Number, String],
        default: props$g.tabs.current
      },
      // 默认读取的键名
      keyName: {
        type: String,
        default: props$g.tabs.keyName
      }
    }
  };
  const _sfc_main$g = {
    name: "u-tabs",
    mixins: [mpMixin, mixin, props$7],
    data() {
      return {
        firstTime: true,
        scrollLeft: 0,
        scrollViewWidth: 0,
        lineOffsetLeft: 0,
        tabsRect: {
          left: 0
        },
        innerCurrent: 0,
        moving: false
      };
    },
    watch: {
      current: {
        immediate: true,
        handler(newValue, oldValue) {
          if (newValue !== this.innerCurrent) {
            this.innerCurrent = newValue;
            this.$nextTick(() => {
              this.resize();
            });
          }
        }
      },
      // list变化时，重新渲染list各项信息
      list() {
        this.$nextTick(() => {
          this.resize();
        });
      }
    },
    computed: {
      textStyle() {
        return (index2) => {
          const style = {};
          const customeStyle = index2 === this.innerCurrent ? uni.$u.addStyle(this.activeStyle) : uni.$u.addStyle(
            this.inactiveStyle
          );
          if (this.list[index2].disabled) {
            style.color = "#c8c9cc";
          }
          return uni.$u.deepMerge(customeStyle, style);
        };
      },
      propsBadge() {
        return uni.$u.props.badge;
      }
    },
    async mounted() {
      this.init();
    },
    emits: ["click", "change"],
    methods: {
      setLineLeft() {
        const tabItem = this.list[this.innerCurrent];
        if (!tabItem) {
          return;
        }
        let lineOffsetLeft = this.list.slice(0, this.innerCurrent).reduce((total, curr) => total + curr.rect.width, 0);
        const lineWidth = uni.$u.getPx(this.lineWidth);
        this.lineOffsetLeft = lineOffsetLeft + (tabItem.rect.width - lineWidth) / 2;
        if (this.firstTime) {
          setTimeout(() => {
            this.firstTime = false;
          }, 10);
        }
      },
      // nvue下设置滑块的位置
      animation(x2, duration = 0) {
      },
      // 点击某一个标签
      clickHandler(item, index2) {
        this.$emit("click", {
          ...item,
          index: index2
        });
        if (item.disabled)
          return;
        this.innerCurrent = index2;
        this.resize();
        this.$emit("change", {
          ...item,
          index: index2
        });
      },
      init() {
        uni.$u.sleep().then(() => {
          this.resize();
        });
      },
      setScrollLeft() {
        const tabRect = this.list[this.innerCurrent];
        const offsetLeft = this.list.slice(0, this.innerCurrent).reduce((total, curr) => {
          return total + curr.rect.width;
        }, 0);
        const windowWidth = uni.$u.sys().windowWidth;
        let scrollLeft = offsetLeft - (this.tabsRect.width - tabRect.rect.width) / 2 - (windowWidth - this.tabsRect.right) / 2 + this.tabsRect.left / 2;
        scrollLeft = Math.min(scrollLeft, this.scrollViewWidth - this.tabsRect.width);
        this.scrollLeft = Math.max(0, scrollLeft);
      },
      // 获取所有标签的尺寸
      resize() {
        if (this.list.length === 0) {
          return;
        }
        Promise.all([this.getTabsRect(), this.getAllItemRect()]).then(([tabsRect, itemRect = []]) => {
          this.tabsRect = tabsRect;
          this.scrollViewWidth = 0;
          itemRect.map((item, index2) => {
            this.scrollViewWidth += item.width;
            this.list[index2].rect = item;
          });
          this.setLineLeft();
          this.setScrollLeft();
        });
      },
      // 获取导航菜单的尺寸
      getTabsRect() {
        return new Promise((resolve) => {
          this.queryRect("u-tabs__wrapper__scroll-view").then((size) => resolve(size));
        });
      },
      // 获取所有标签的尺寸
      getAllItemRect() {
        return new Promise((resolve) => {
          const promiseAllArr = this.list.map((item, index2) => this.queryRect(
            `u-tabs__wrapper__nav__item-${index2}`,
            true
          ));
          Promise.all(promiseAllArr).then((sizes) => resolve(sizes));
        });
      },
      // 获取各个标签的尺寸
      queryRect(el, item) {
        return new Promise((resolve) => {
          this.$uGetRect(`.${el}`).then((size) => {
            resolve(size);
          });
        });
      }
    }
  };
  function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_badge = resolveEasycom(vue.resolveDynamicComponent("u-badge"), __easycom_0$3);
    return vue.openBlock(), vue.createElementBlock("view", { class: "u-tabs" }, [
      vue.createElementVNode("view", { class: "u-tabs__wrapper" }, [
        vue.renderSlot(_ctx.$slots, "left", {}, void 0, true),
        vue.createElementVNode("view", { class: "u-tabs__wrapper__scroll-view-wrapper" }, [
          vue.createElementVNode("scroll-view", {
            "scroll-x": _ctx.scrollable,
            "scroll-left": $data.scrollLeft,
            "scroll-with-animation": "",
            class: "u-tabs__wrapper__scroll-view",
            "show-scrollbar": false,
            ref: "u-tabs__wrapper__scroll-view"
          }, [
            vue.createElementVNode(
              "view",
              {
                class: "u-tabs__wrapper__nav",
                ref: "u-tabs__wrapper__nav"
              },
              [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList(_ctx.list, (item, index2) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      class: vue.normalizeClass(["u-tabs__wrapper__nav__item", [`u-tabs__wrapper__nav__item-${index2}`, item.disabled && "u-tabs__wrapper__nav__item--disabled"]]),
                      key: index2,
                      onClick: ($event) => $options.clickHandler(item, index2),
                      ref_for: true,
                      ref: `u-tabs__wrapper__nav__item-${index2}`,
                      style: vue.normalizeStyle([_ctx.$u.addStyle(_ctx.itemStyle), { flex: _ctx.scrollable ? "" : 1 }])
                    }, [
                      vue.createElementVNode(
                        "text",
                        {
                          class: vue.normalizeClass([[item.disabled && "u-tabs__wrapper__nav__item__text--disabled"], "u-tabs__wrapper__nav__item__text"]),
                          style: vue.normalizeStyle([$options.textStyle(index2)])
                        },
                        vue.toDisplayString(item[_ctx.keyName]),
                        7
                        /* TEXT, CLASS, STYLE */
                      ),
                      vue.createVNode(_component_u_badge, {
                        show: !!(item.badge && (item.badge.show || item.badge.isDot || item.badge.value)),
                        isDot: item.badge && item.badge.isDot || $options.propsBadge.isDot,
                        value: item.badge && item.badge.value || $options.propsBadge.value,
                        max: item.badge && item.badge.max || $options.propsBadge.max,
                        type: item.badge && item.badge.type || $options.propsBadge.type,
                        showZero: item.badge && item.badge.showZero || $options.propsBadge.showZero,
                        bgColor: item.badge && item.badge.bgColor || $options.propsBadge.bgColor,
                        color: item.badge && item.badge.color || $options.propsBadge.color,
                        shape: item.badge && item.badge.shape || $options.propsBadge.shape,
                        numberType: item.badge && item.badge.numberType || $options.propsBadge.numberType,
                        inverted: item.badge && item.badge.inverted || $options.propsBadge.inverted,
                        customStyle: "margin-left: 4px;"
                      }, null, 8, ["show", "isDot", "value", "max", "type", "showZero", "bgColor", "color", "shape", "numberType", "inverted"])
                    ], 14, ["onClick"]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                )),
                vue.createElementVNode(
                  "view",
                  {
                    class: "u-tabs__wrapper__nav__line",
                    ref: "u-tabs__wrapper__nav__line",
                    style: vue.normalizeStyle([{
                      width: _ctx.$u.addUnit(_ctx.lineWidth),
                      transform: `translate(${$data.lineOffsetLeft}px)`,
                      transitionDuration: `${$data.firstTime ? 0 : _ctx.duration}ms`,
                      height: _ctx.$u.addUnit(_ctx.lineHeight),
                      background: _ctx.lineColor,
                      backgroundSize: _ctx.lineBgSize
                    }])
                  },
                  null,
                  4
                  /* STYLE */
                )
              ],
              512
              /* NEED_PATCH */
            )
          ], 8, ["scroll-x", "scroll-left"])
        ]),
        vue.renderSlot(_ctx.$slots, "right", {}, void 0, true)
      ])
    ]);
  }
  const __easycom_0$2 = /* @__PURE__ */ _export_sfc(_sfc_main$g, [["render", _sfc_render$8], ["__scopeId", "data-v-02b0c54f"], ["__file", "E:/Uni-App/urshop/uni_modules/uview-plus/components/u-tabs/u-tabs.vue"]]);
  const _sfc_main$f = {
    __name: "subcategory",
    setup(__props) {
      let subcatelist = vue.ref([]);
      let subcateProduct = vue.ref([]);
      onLoad(async (option) => {
        formatAppLog("log", "at pages/subcategory/subcategory.vue:52", option);
        const subListRes = await getASubList({ catId: option.id });
        formatAppLog("log", "at pages/subcategory/subcategory.vue:55", subListRes.Data.length);
        if (subListRes.Data.length !== 0) {
          subcatelist.value = subListRes.Data;
          const findRes = await getFindbycid({ cid: subListRes.Data[0].Id, page: 1 });
          formatAppLog("log", "at pages/subcategory/subcategory.vue:59", findRes);
          subcateProduct.value = findRes.Data.Items;
        } else {
          const findRes = await getFindbycid({ cid: option.id, page: 1 });
          formatAppLog("log", "at pages/subcategory/subcategory.vue:63", findRes);
          subcateProduct.value = findRes.Data.Items;
        }
      });
      const click = (item) => {
        formatAppLog("log", "at pages/subcategory/subcategory.vue:68", item);
      };
      const lower = (item) => {
        formatAppLog("log", "at pages/subcategory/subcategory.vue:71", item);
      };
      return (_ctx, _cache) => {
        const _component_u_tabs = resolveEasycom(vue.resolveDynamicComponent("u-tabs"), __easycom_0$2);
        return vue.openBlock(), vue.createElementBlock(
          vue.Fragment,
          null,
          [
            vue.createCommentVNode(' <view class="subcategory-cont"> '),
            vue.createCommentVNode('    <view class="subcategory-head">\n      <text\n        class="subcategory-item"\n        v-for="item in subcatelist"\n        :key="item.Id"\n        :class="{ active: select === item.Id }"\n        :data-id="item.Id"\n        :data-tab="item.Id"\n        @tap="switchClick"\n      >\n        {{ item.Name }}\n      </text>\n    </view> '),
            vue.createVNode(_component_u_tabs, {
              lineColor: "#950000",
              lineWidth: "50",
              lineHeight: "10",
              list: vue.unref(subcatelist),
              keyName: "Name",
              onClick: click
            }, null, 8, ["list"]),
            vue.createElementVNode(
              "scroll-view",
              {
                "scroll-y": "",
                class: vue.normalizeClass(["subcategory-scroll", { "top0": !vue.unref(subcatelist).length }]),
                onScrolltolower: lower
              },
              [
                vue.createElementVNode("view", { class: "subcategory-cont-box" }, [
                  (vue.openBlock(true), vue.createElementBlock(
                    vue.Fragment,
                    null,
                    vue.renderList(vue.unref(subcateProduct), (item, index2) => {
                      return vue.openBlock(), vue.createElementBlock("navigator", {
                        class: "subcategory-list",
                        url: `/pages/detail/detail?id=${item.Id}`,
                        key: index2,
                        "data-index": index2
                      }, [
                        vue.createElementVNode("view", { class: "subcategory-img" }, [
                          vue.createElementVNode("image", {
                            src: item.Picture.BigUrl
                          }, null, 8, ["src"])
                        ]),
                        vue.createElementVNode("view", { class: "subcategory-info" }, [
                          vue.createElementVNode(
                            "text",
                            { class: "subcategory-name" },
                            vue.toDisplayString(item.Name),
                            1
                            /* TEXT */
                          ),
                          vue.createElementVNode(
                            "text",
                            { class: "subcategory-text" },
                            vue.toDisplayString(item.Short),
                            1
                            /* TEXT */
                          ),
                          vue.createElementVNode(
                            "text",
                            { class: "subcategory-price" },
                            vue.toDisplayString(item.Price.Price),
                            1
                            /* TEXT */
                          )
                        ])
                      ], 8, ["url", "data-index"]);
                    }),
                    128
                    /* KEYED_FRAGMENT */
                  ))
                ])
              ],
              34
              /* CLASS, HYDRATE_EVENTS */
            ),
            vue.createCommentVNode(" </view> ")
          ],
          64
          /* STABLE_FRAGMENT */
        );
      };
    }
  };
  const PagesSubcategorySubcategory = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["__scopeId", "data-v-acfd45df"], ["__file", "E:/Uni-App/urshop/pages/subcategory/subcategory.vue"]]);
  const props$6 = {
    props: {
      // 轮播的长度
      length: {
        type: [String, Number],
        default: props$g.swiperIndicator.length
      },
      // 当前处于活动状态的轮播的索引
      current: {
        type: [String, Number],
        default: props$g.swiperIndicator.current
      },
      // 指示器非激活颜色
      indicatorActiveColor: {
        type: String,
        default: props$g.swiperIndicator.indicatorActiveColor
      },
      // 指示器的激活颜色
      indicatorInactiveColor: {
        type: String,
        default: props$g.swiperIndicator.indicatorInactiveColor
      },
      // 指示器模式，line-线型，dot-点型
      indicatorMode: {
        type: String,
        default: props$g.swiperIndicator.indicatorMode
      }
    }
  };
  const _sfc_main$e = {
    name: "u-swiper-indicator",
    mixins: [mpMixin, mixin, props$6],
    data() {
      return {
        lineWidth: 22
      };
    },
    computed: {
      // 指示器为线型的样式
      lineStyle() {
        let style = {};
        style.width = uni.$u.addUnit(this.lineWidth);
        style.transform = `translateX(${uni.$u.addUnit(this.current * this.lineWidth)})`;
        style.backgroundColor = this.indicatorActiveColor;
        return style;
      },
      // 指示器为点型的样式
      dotStyle() {
        return (index2) => {
          let style = {};
          style.backgroundColor = index2 === this.current ? this.indicatorActiveColor : this.indicatorInactiveColor;
          return style;
        };
      }
    }
  };
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "u-swiper-indicator" }, [
      _ctx.indicatorMode === "line" ? (vue.openBlock(), vue.createElementBlock(
        "view",
        {
          key: 0,
          class: vue.normalizeClass(["u-swiper-indicator__wrapper", [`u-swiper-indicator__wrapper--${_ctx.indicatorMode}`]]),
          style: vue.normalizeStyle({
            width: _ctx.$u.addUnit($data.lineWidth * _ctx.length),
            backgroundColor: _ctx.indicatorInactiveColor
          })
        },
        [
          vue.createElementVNode(
            "view",
            {
              class: "u-swiper-indicator__wrapper--line__bar",
              style: vue.normalizeStyle([$options.lineStyle])
            },
            null,
            4
            /* STYLE */
          )
        ],
        6
        /* CLASS, STYLE */
      )) : vue.createCommentVNode("v-if", true),
      _ctx.indicatorMode === "dot" ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "u-swiper-indicator__wrapper"
      }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList(_ctx.length, (item, index2) => {
            return vue.openBlock(), vue.createElementBlock(
              "view",
              {
                class: vue.normalizeClass(["u-swiper-indicator__wrapper__dot", [index2 === _ctx.current && "u-swiper-indicator__wrapper__dot--active"]]),
                key: index2,
                style: vue.normalizeStyle([$options.dotStyle(index2)])
              },
              null,
              6
              /* CLASS, STYLE */
            );
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ])) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const __easycom_1$1 = /* @__PURE__ */ _export_sfc(_sfc_main$e, [["render", _sfc_render$7], ["__scopeId", "data-v-7b7c7ea6"], ["__file", "E:/Uni-App/urshop/uni_modules/uview-plus/components/u-swiper-indicator/u-swiper-indicator.vue"]]);
  const props$5 = {
    props: {
      // 列表数组，元素可为字符串，如为对象可通过keyName指定目标属性名
      list: {
        type: Array,
        default: props$g.swiper.list
      },
      // 是否显示面板指示器
      indicator: {
        type: Boolean,
        default: props$g.swiper.indicator
      },
      // 指示器非激活颜色
      indicatorActiveColor: {
        type: String,
        default: props$g.swiper.indicatorActiveColor
      },
      // 指示器的激活颜色
      indicatorInactiveColor: {
        type: String,
        default: props$g.swiper.indicatorInactiveColor
      },
      // 指示器样式，可通过bottom，left，right进行定位
      indicatorStyle: {
        type: [String, Object],
        default: props$g.swiper.indicatorStyle
      },
      // 指示器模式，line-线型，dot-点型
      indicatorMode: {
        type: String,
        default: props$g.swiper.indicatorMode
      },
      // 是否自动切换
      autoplay: {
        type: Boolean,
        default: props$g.swiper.autoplay
      },
      // 当前所在滑块的 index
      current: {
        type: [String, Number],
        default: props$g.swiper.current
      },
      // 当前所在滑块的 item-id ，不能与 current 被同时指定
      currentItemId: {
        type: String,
        default: props$g.swiper.currentItemId
      },
      // 滑块自动切换时间间隔
      interval: {
        type: [String, Number],
        default: props$g.swiper.interval
      },
      // 滑块切换过程所需时间
      duration: {
        type: [String, Number],
        default: props$g.swiper.duration
      },
      // 播放到末尾后是否重新回到开头
      circular: {
        type: Boolean,
        default: props$g.swiper.circular
      },
      // 前边距，可用于露出前一项的一小部分，nvue和支付宝不支持
      previousMargin: {
        type: [String, Number],
        default: props$g.swiper.previousMargin
      },
      // 后边距，可用于露出后一项的一小部分，nvue和支付宝不支持
      nextMargin: {
        type: [String, Number],
        default: props$g.swiper.nextMargin
      },
      // 当开启时，会根据滑动速度，连续滑动多屏，支付宝不支持
      acceleration: {
        type: Boolean,
        default: props$g.swiper.acceleration
      },
      // 同时显示的滑块数量，nvue、支付宝小程序不支持
      displayMultipleItems: {
        type: Number,
        default: props$g.swiper.displayMultipleItems
      },
      // 指定swiper切换缓动动画类型，有效值：default、linear、easeInCubic、easeOutCubic、easeInOutCubic
      // 只对微信小程序有效
      easingFunction: {
        type: String,
        default: props$g.swiper.easingFunction
      },
      // list数组中指定对象的目标属性名
      keyName: {
        type: String,
        default: props$g.swiper.keyName
      },
      // 图片的裁剪模式
      imgMode: {
        type: String,
        default: props$g.swiper.imgMode
      },
      // 组件高度
      height: {
        type: [String, Number],
        default: props$g.swiper.height
      },
      // 背景颜色
      bgColor: {
        type: String,
        default: props$g.swiper.bgColor
      },
      // 组件圆角，数值或带单位的字符串
      radius: {
        type: [String, Number],
        default: props$g.swiper.radius
      },
      // 是否加载中
      loading: {
        type: Boolean,
        default: props$g.swiper.loading
      },
      // 是否显示标题，要求数组对象中有title属性
      showTitle: {
        type: Boolean,
        default: props$g.swiper.showTitle
      }
    }
  };
  const _sfc_main$d = {
    name: "u-swiper",
    mixins: [mpMixin, mixin, props$5],
    data() {
      return {
        currentIndex: 0
      };
    },
    watch: {
      current(val, preVal) {
        if (val === preVal)
          return;
        this.currentIndex = val;
      }
    },
    computed: {
      itemStyle() {
        return (index2) => {
          const style = {};
          if (this.nextMargin && this.previousMargin) {
            style.borderRadius = uni.$u.addUnit(this.radius);
            if (index2 !== this.currentIndex)
              style.transform = "scale(0.92)";
          }
          return style;
        };
      }
    },
    methods: {
      getItemType(item) {
        if (typeof item === "string")
          return uni.$u.test.video(this.getSource(item)) ? "video" : "image";
        if (typeof item === "object" && this.keyName) {
          if (!item.type)
            return uni.$u.test.video(this.getSource(item)) ? "video" : "image";
          if (item.type === "image")
            return "image";
          if (item.type === "video")
            return "video";
          return "image";
        }
      },
      // 获取目标路径，可能数组中为字符串，对象的形式，额外可指定对象的目标属性名keyName
      getSource(item) {
        if (typeof item === "string")
          return item;
        if (typeof item === "object" && this.keyName)
          return item[this.keyName];
        else
          uni.$u.error("请按格式传递列表参数");
        return "";
      },
      // 轮播切换事件
      change(e) {
        const {
          current
        } = e.detail;
        this.pauseVideo(this.currentIndex);
        this.currentIndex = current;
        this.$emit("change", e.detail);
      },
      // 切换轮播时，暂停视频播放
      pauseVideo(index2) {
        const lastItem = this.getSource(this.list[index2]);
        if (uni.$u.test.video(lastItem)) {
          const video2 = uni.createVideoContext(`video-${index2}`, this);
          video2.pause();
        }
      },
      // 当一个轮播item为视频时，获取它的视频海报
      getPoster(item) {
        return typeof item === "object" && item.poster ? item.poster : "";
      },
      // 点击某个item
      clickHandler(index2) {
        this.$emit("click", index2);
      }
    }
  };
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_loading_icon = resolveEasycom(vue.resolveDynamicComponent("u-loading-icon"), __easycom_0$6);
    const _component_u_swiper_indicator = resolveEasycom(vue.resolveDynamicComponent("u-swiper-indicator"), __easycom_1$1);
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: "u-swiper",
        style: vue.normalizeStyle({
          backgroundColor: _ctx.bgColor,
          height: _ctx.$u.addUnit(_ctx.height),
          borderRadius: _ctx.$u.addUnit(_ctx.radius)
        })
      },
      [
        _ctx.loading ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "u-swiper__loading"
        }, [
          vue.createVNode(_component_u_loading_icon, { mode: "circle" })
        ])) : (vue.openBlock(), vue.createElementBlock("swiper", {
          key: 1,
          class: "u-swiper__wrapper",
          style: vue.normalizeStyle({
            height: _ctx.$u.addUnit(_ctx.height)
          }),
          onChange: _cache[0] || (_cache[0] = (...args) => $options.change && $options.change(...args)),
          circular: _ctx.circular,
          interval: _ctx.interval,
          duration: _ctx.duration,
          autoplay: _ctx.autoplay,
          current: _ctx.current,
          currentItemId: _ctx.currentItemId,
          previousMargin: _ctx.$u.addUnit(_ctx.previousMargin),
          nextMargin: _ctx.$u.addUnit(_ctx.nextMargin),
          acceleration: _ctx.acceleration,
          displayMultipleItems: _ctx.displayMultipleItems,
          easingFunction: _ctx.easingFunction
        }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList(_ctx.list, (item, index2) => {
              return vue.openBlock(), vue.createElementBlock("swiper-item", {
                class: "u-swiper__wrapper__item",
                key: index2
              }, [
                vue.createElementVNode(
                  "view",
                  {
                    class: "u-swiper__wrapper__item__wrapper",
                    style: vue.normalizeStyle([$options.itemStyle(index2)])
                  },
                  [
                    vue.createCommentVNode(" 在nvue中，image图片的宽度默认为屏幕宽度，需要通过flex:1撑开，另外必须设置高度才能显示图片 "),
                    $options.getItemType(item) === "image" ? (vue.openBlock(), vue.createElementBlock("image", {
                      key: 0,
                      class: "u-swiper__wrapper__item__wrapper__image",
                      src: $options.getSource(item),
                      mode: _ctx.imgMode,
                      onClick: ($event) => $options.clickHandler(index2),
                      style: vue.normalizeStyle({
                        height: _ctx.$u.addUnit(_ctx.height),
                        borderRadius: _ctx.$u.addUnit(_ctx.radius)
                      })
                    }, null, 12, ["src", "mode", "onClick"])) : vue.createCommentVNode("v-if", true),
                    $options.getItemType(item) === "video" ? (vue.openBlock(), vue.createElementBlock("video", {
                      key: 1,
                      class: "u-swiper__wrapper__item__wrapper__video",
                      id: `video-${index2}`,
                      "enable-progress-gesture": false,
                      src: $options.getSource(item),
                      poster: $options.getPoster(item),
                      title: _ctx.showTitle && _ctx.$u.test.object(item) && item.title ? item.title : "",
                      style: vue.normalizeStyle({
                        height: _ctx.$u.addUnit(_ctx.height)
                      }),
                      controls: "",
                      onClick: ($event) => $options.clickHandler(index2)
                    }, null, 12, ["id", "src", "poster", "title", "onClick"])) : vue.createCommentVNode("v-if", true),
                    _ctx.showTitle && _ctx.$u.test.object(item) && item.title && _ctx.$u.test.image($options.getSource(item)) ? (vue.openBlock(), vue.createElementBlock(
                      "text",
                      {
                        key: 2,
                        class: "u-swiper__wrapper__item__wrapper__title u-line-1"
                      },
                      vue.toDisplayString(item.title),
                      1
                      /* TEXT */
                    )) : vue.createCommentVNode("v-if", true)
                  ],
                  4
                  /* STYLE */
                )
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ], 44, ["circular", "interval", "duration", "autoplay", "current", "currentItemId", "previousMargin", "nextMargin", "acceleration", "displayMultipleItems", "easingFunction"])),
        vue.createElementVNode(
          "view",
          {
            class: "u-swiper__indicator",
            style: vue.normalizeStyle([_ctx.$u.addStyle(_ctx.indicatorStyle)])
          },
          [
            vue.renderSlot(_ctx.$slots, "indicator", {}, () => [
              !_ctx.loading && _ctx.indicator && !_ctx.showTitle ? (vue.openBlock(), vue.createBlock(_component_u_swiper_indicator, {
                key: 0,
                indicatorActiveColor: _ctx.indicatorActiveColor,
                indicatorInactiveColor: _ctx.indicatorInactiveColor,
                length: _ctx.list.length,
                current: $data.currentIndex,
                indicatorMode: _ctx.indicatorMode
              }, null, 8, ["indicatorActiveColor", "indicatorInactiveColor", "length", "current", "indicatorMode"])) : vue.createCommentVNode("v-if", true)
            ], true)
          ],
          4
          /* STYLE */
        )
      ],
      4
      /* STYLE */
    );
  }
  const __easycom_0$1 = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["render", _sfc_render$6], ["__scopeId", "data-v-4e7d0c90"], ["__file", "E:/Uni-App/urshop/uni_modules/uview-plus/components/u-swiper/u-swiper.vue"]]);
  const props$4 = {
    props: {
      // 步进器标识符，在change回调返回
      name: {
        type: [String, Number],
        default: props$g.numberBox.name
      },
      // 用于双向绑定的值，初始化时设置设为默认min值(最小值)
      modelValue: {
        type: [String, Number],
        default: props$g.numberBox.value
      },
      // 最小值
      min: {
        type: [String, Number],
        default: props$g.numberBox.min
      },
      // 最大值
      max: {
        type: [String, Number],
        default: props$g.numberBox.max
      },
      // 加减的步长，可为小数
      step: {
        type: [String, Number],
        default: props$g.numberBox.step
      },
      // 是否只允许输入整数
      integer: {
        type: Boolean,
        default: props$g.numberBox.integer
      },
      // 是否禁用，包括输入框，加减按钮
      disabled: {
        type: Boolean,
        default: props$g.numberBox.disabled
      },
      // 是否禁用输入框
      disabledInput: {
        type: Boolean,
        default: props$g.numberBox.disabledInput
      },
      // 是否开启异步变更，开启后需要手动控制输入值
      asyncChange: {
        type: Boolean,
        default: props$g.numberBox.asyncChange
      },
      // 输入框宽度，单位为px
      inputWidth: {
        type: [String, Number],
        default: props$g.numberBox.inputWidth
      },
      // 是否显示减少按钮
      showMinus: {
        type: Boolean,
        default: props$g.numberBox.showMinus
      },
      // 是否显示增加按钮
      showPlus: {
        type: Boolean,
        default: props$g.numberBox.showPlus
      },
      // 显示的小数位数
      decimalLength: {
        type: [String, Number, null],
        default: props$g.numberBox.decimalLength
      },
      // 是否开启长按加减手势
      longPress: {
        type: Boolean,
        default: props$g.numberBox.longPress
      },
      // 输入框文字和加减按钮图标的颜色
      color: {
        type: String,
        default: props$g.numberBox.color
      },
      // 按钮大小，宽高等于此值，单位px，输入框高度和此值保持一致
      buttonSize: {
        type: [String, Number],
        default: props$g.numberBox.buttonSize
      },
      // 输入框和按钮的背景颜色
      bgColor: {
        type: String,
        default: props$g.numberBox.bgColor
      },
      // 指定光标于键盘的距离，避免键盘遮挡输入框，单位px
      cursorSpacing: {
        type: [String, Number],
        default: props$g.numberBox.cursorSpacing
      },
      // 是否禁用增加按钮
      disablePlus: {
        type: Boolean,
        default: props$g.numberBox.disablePlus
      },
      // 是否禁用减少按钮
      disableMinus: {
        type: Boolean,
        default: props$g.numberBox.disableMinus
      },
      // 加减按钮图标的样式
      iconStyle: {
        type: [Object, String],
        default: props$g.numberBox.iconStyle
      }
    }
  };
  const _sfc_main$c = {
    name: "u-number-box",
    mixins: [mpMixin, mixin, props$4],
    data() {
      return {
        // 输入框实际操作的值
        currentValue: "",
        // 定时器
        longPressTimer: null
      };
    },
    watch: {
      // 多个值之间，只要一个值发生变化，都要重新检查check()函数
      watchChange(n2) {
        this.check();
      },
      // 监听v-mode的变化，重新初始化内部的值
      modelValue(n2) {
        if (n2 !== this.currentValue) {
          this.currentValue = this.format(this.modelValue);
        }
      }
    },
    computed: {
      getCursorSpacing() {
        return uni.$u.getPx(this.cursorSpacing);
      },
      // 按钮的样式
      buttonStyle() {
        return (type) => {
          const style = {
            backgroundColor: this.bgColor,
            height: uni.$u.addUnit(this.buttonSize),
            color: this.color
          };
          if (this.isDisabled(type)) {
            style.backgroundColor = "#f7f8fa";
          }
          return style;
        };
      },
      // 输入框的样式
      inputStyle() {
        this.disabled || this.disabledInput;
        const style = {
          color: this.color,
          backgroundColor: this.bgColor,
          height: uni.$u.addUnit(this.buttonSize),
          width: uni.$u.addUnit(this.inputWidth)
        };
        return style;
      },
      // 用于监听多个值发生变化
      watchChange() {
        return [this.integer, this.decimalLength, this.min, this.max];
      },
      isDisabled() {
        return (type) => {
          if (type === "plus") {
            return this.disabled || this.disablePlus || this.currentValue >= this.max;
          }
          return this.disabled || this.disableMinus || this.currentValue <= this.min;
        };
      }
    },
    mounted() {
      this.init();
    },
    emits: ["update:modelValue", "focus", "blur", "overlimit", "change", "plus", "minus"],
    methods: {
      init() {
        this.currentValue = this.format(this.modelValue);
      },
      // 格式化整理数据，限制范围
      format(value) {
        value = this.filter(value);
        value = value === "" ? 0 : +value;
        value = Math.max(Math.min(this.max, value), this.min);
        if (this.decimalLength !== null) {
          value = value.toFixed(this.decimalLength);
        }
        return value;
      },
      // 过滤非法的字符
      filter(value) {
        value = String(value).replace(/[^0-9.-]/g, "");
        if (this.integer && value.indexOf(".") !== -1) {
          value = value.split(".")[0];
        }
        return value;
      },
      check() {
        const val = this.format(this.currentValue);
        if (val !== this.currentValue) {
          this.currentValue = val;
        }
      },
      // 判断是否出于禁止操作状态
      // isDisabled(type) {
      // 	if (type === 'plus') {
      // 		// 在点击增加按钮情况下，判断整体的disabled，是否单独禁用增加按钮，以及当前值是否大于最大的允许值
      // 		return (
      // 			this.disabled ||
      // 			this.disablePlus ||
      // 			this.currentValue >= this.max
      // 		)
      // 	}
      // 	// 点击减少按钮同理
      // 	return (
      // 		this.disabled ||
      // 		this.disableMinus ||
      // 		this.currentValue <= this.min
      // 	)
      // },
      // 输入框活动焦点
      onFocus(event) {
        this.$emit("focus", {
          ...event.detail,
          name: this.name
        });
      },
      // 输入框失去焦点
      onBlur(event) {
        this.format(event.detail.value);
        this.$emit(
          "blur",
          {
            ...event.detail,
            name: this.name
          }
        );
      },
      // 输入框值发生变化
      onInput(e) {
        const {
          value = ""
        } = e.detail || {};
        if (value === "")
          return;
        let formatted = this.filter(value);
        if (this.decimalLength !== null && formatted.indexOf(".") !== -1) {
          const pair = formatted.split(".");
          formatted = `${pair[0]}.${pair[1].slice(0, this.decimalLength)}`;
        }
        formatted = this.format(formatted);
        this.emitChange(formatted);
      },
      // 发出change事件
      emitChange(value) {
        if (!this.asyncChange) {
          this.$nextTick(() => {
            this.$emit("update:modelValue", value);
            this.currentValue = value;
            this.$forceUpdate();
          });
        }
        this.$emit("change", {
          value,
          name: this.name
        });
      },
      onChange() {
        const {
          type
        } = this;
        if (this.isDisabled(type)) {
          return this.$emit("overlimit", type);
        }
        const diff = type === "minus" ? -this.step : +this.step;
        const value = this.format(this.add(+this.currentValue, diff));
        this.emitChange(value);
        this.$emit(type);
      },
      // 对值扩大后进行四舍五入，再除以扩大因子，避免出现浮点数操作的精度问题
      add(num1, num2) {
        const cardinal = Math.pow(10, 10);
        return Math.round((num1 + num2) * cardinal) / cardinal;
      },
      // 点击加减按钮
      clickHandler(type) {
        this.type = type;
        this.onChange();
      },
      longPressStep() {
        this.clearTimeout();
        this.longPressTimer = setTimeout(() => {
          this.onChange();
          this.longPressStep();
        }, 250);
      },
      onTouchStart(type) {
        if (!this.longPress)
          return;
        this.clearTimeout();
        this.type = type;
        this.longPressTimer = setTimeout(() => {
          this.onChange();
          this.longPressStep();
        }, 600);
      },
      // 触摸结束，清除定时器，停止长按加减
      onTouchEnd() {
        if (!this.longPress)
          return;
        this.clearTimeout();
      },
      // 清除定时器
      clearTimeout() {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$8);
    return vue.openBlock(), vue.createElementBlock("view", { class: "u-number-box" }, [
      _ctx.showMinus && _ctx.$slots.minus ? (vue.openBlock(), vue.createElementBlock(
        "view",
        {
          key: 0,
          class: "u-number-box__slot",
          onClick: _cache[0] || (_cache[0] = vue.withModifiers(($event) => $options.clickHandler("minus"), ["stop"])),
          onTouchstart: _cache[1] || (_cache[1] = ($event) => $options.onTouchStart("minus")),
          onTouchend: _cache[2] || (_cache[2] = vue.withModifiers((...args) => $options.clearTimeout && $options.clearTimeout(...args), ["stop"]))
        },
        [
          vue.renderSlot(_ctx.$slots, "minus", {}, void 0, true)
        ],
        32
        /* HYDRATE_EVENTS */
      )) : _ctx.showMinus ? (vue.openBlock(), vue.createElementBlock(
        "view",
        {
          key: 1,
          class: vue.normalizeClass(["u-number-box__minus", { "u-number-box__minus--disabled": $options.isDisabled("minus") }]),
          onClick: _cache[3] || (_cache[3] = vue.withModifiers(($event) => $options.clickHandler("minus"), ["stop"])),
          onTouchstart: _cache[4] || (_cache[4] = ($event) => $options.onTouchStart("minus")),
          onTouchend: _cache[5] || (_cache[5] = vue.withModifiers((...args) => $options.clearTimeout && $options.clearTimeout(...args), ["stop"])),
          "hover-class": "u-number-box__minus--hover",
          "hover-stay-time": "150",
          style: vue.normalizeStyle([$options.buttonStyle("minus")])
        },
        [
          vue.createVNode(_component_u_icon, {
            name: "minus",
            color: $options.isDisabled("minus") ? "#c8c9cc" : "#323233",
            size: "15",
            bold: "",
            customStyle: _ctx.iconStyle
          }, null, 8, ["color", "customStyle"])
        ],
        38
        /* CLASS, STYLE, HYDRATE_EVENTS */
      )) : vue.createCommentVNode("v-if", true),
      vue.renderSlot(_ctx.$slots, "input", {}, () => [
        vue.withDirectives(vue.createElementVNode("input", {
          disabled: _ctx.disabledInput || _ctx.disabled,
          "cursor-spacing": $options.getCursorSpacing,
          class: vue.normalizeClass([{ "u-number-box__input--disabled": _ctx.disabled || _ctx.disabledInput }, "u-number-box__input"]),
          "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $data.currentValue = $event),
          onBlur: _cache[7] || (_cache[7] = (...args) => $options.onBlur && $options.onBlur(...args)),
          onFocus: _cache[8] || (_cache[8] = (...args) => $options.onFocus && $options.onFocus(...args)),
          onInput: _cache[9] || (_cache[9] = (...args) => $options.onInput && $options.onInput(...args)),
          type: "number",
          style: vue.normalizeStyle([$options.inputStyle])
        }, null, 46, ["disabled", "cursor-spacing"]), [
          [vue.vModelText, $data.currentValue]
        ])
      ], true),
      _ctx.showPlus && _ctx.$slots.plus ? (vue.openBlock(), vue.createElementBlock(
        "view",
        {
          key: 2,
          class: "u-number-box__slot",
          onClick: _cache[10] || (_cache[10] = vue.withModifiers(($event) => $options.clickHandler("plus"), ["stop"])),
          onTouchstart: _cache[11] || (_cache[11] = ($event) => $options.onTouchStart("plus")),
          onTouchend: _cache[12] || (_cache[12] = vue.withModifiers((...args) => $options.clearTimeout && $options.clearTimeout(...args), ["stop"]))
        },
        [
          vue.renderSlot(_ctx.$slots, "plus", {}, void 0, true)
        ],
        32
        /* HYDRATE_EVENTS */
      )) : _ctx.showPlus ? (vue.openBlock(), vue.createElementBlock(
        "view",
        {
          key: 3,
          class: vue.normalizeClass(["u-number-box__plus", { "u-number-box__minus--disabled": $options.isDisabled("plus") }]),
          onClick: _cache[13] || (_cache[13] = vue.withModifiers(($event) => $options.clickHandler("plus"), ["stop"])),
          onTouchstart: _cache[14] || (_cache[14] = ($event) => $options.onTouchStart("plus")),
          onTouchend: _cache[15] || (_cache[15] = vue.withModifiers((...args) => $options.clearTimeout && $options.clearTimeout(...args), ["stop"])),
          "hover-class": "u-number-box__plus--hover",
          "hover-stay-time": "150",
          style: vue.normalizeStyle([$options.buttonStyle("plus")])
        },
        [
          vue.createVNode(_component_u_icon, {
            name: "plus",
            color: $options.isDisabled("plus") ? "#c8c9cc" : "#323233",
            size: "15",
            bold: "",
            customStyle: _ctx.iconStyle
          }, null, 8, ["color", "customStyle"])
        ],
        38
        /* CLASS, STYLE, HYDRATE_EVENTS */
      )) : vue.createCommentVNode("v-if", true)
    ]);
  }
  const __easycom_2 = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["render", _sfc_render$5], ["__scopeId", "data-v-eb6f6237"], ["__file", "E:/Uni-App/urshop/uni_modules/uview-plus/components/u-number-box/u-number-box.vue"]]);
  const props$3 = {
    props: {
      // 是否显示遮罩
      show: {
        type: Boolean,
        default: props$g.overlay.show
      },
      // 层级z-index
      zIndex: {
        type: [String, Number],
        default: props$g.overlay.zIndex
      },
      // 遮罩的过渡时间，单位为ms
      duration: {
        type: [String, Number],
        default: props$g.overlay.duration
      },
      // 不透明度值，当做rgba的第四个参数
      opacity: {
        type: [String, Number],
        default: props$g.overlay.opacity
      }
    }
  };
  const _sfc_main$b = {
    name: "u-overlay",
    mixins: [mpMixin, mixin, props$3],
    computed: {
      overlayStyle() {
        const style = {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: this.zIndex,
          bottom: 0,
          "background-color": `rgba(0, 0, 0, ${this.opacity})`
        };
        return uni.$u.deepMerge(style, uni.$u.addStyle(this.customStyle));
      }
    },
    methods: {
      clickHandler() {
        this.$emit("click");
      }
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_transition = resolveEasycom(vue.resolveDynamicComponent("u-transition"), __easycom_4);
    return vue.openBlock(), vue.createBlock(_component_u_transition, {
      show: _ctx.show,
      "custom-class": "u-overlay",
      duration: _ctx.duration,
      "custom-style": $options.overlayStyle,
      onClick: $options.clickHandler
    }, {
      default: vue.withCtx(() => [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ]),
      _: 3
      /* FORWARDED */
    }, 8, ["show", "duration", "custom-style", "onClick"]);
  }
  const __easycom_0 = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["render", _sfc_render$4], ["__scopeId", "data-v-9112bed9"], ["__file", "E:/Uni-App/urshop/uni_modules/uview-plus/components/u-overlay/u-overlay.vue"]]);
  const props$2 = {
    props: {
      bgColor: {
        type: String,
        default: props$g.statusBar.bgColor
      }
    }
  };
  const _sfc_main$a = {
    name: "u-status-bar",
    mixins: [mpMixin, mixin, props$2],
    data() {
      return {};
    },
    computed: {
      style() {
        const style = {};
        style.height = uni.$u.addUnit(uni.$u.sys().statusBarHeight, "px");
        style.backgroundColor = this.bgColor;
        return uni.$u.deepMerge(style, uni.$u.addStyle(this.customStyle));
      }
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        style: vue.normalizeStyle([$options.style]),
        class: "u-status-bar"
      },
      [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ],
      4
      /* STYLE */
    );
  }
  const __easycom_1 = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["render", _sfc_render$3], ["__scopeId", "data-v-eb8e0cdd"], ["__file", "E:/Uni-App/urshop/uni_modules/uview-plus/components/u-status-bar/u-status-bar.vue"]]);
  const props$1 = {
    props: {}
  };
  const _sfc_main$9 = {
    name: "u-safe-bottom",
    mixins: [mpMixin, mixin, props$1],
    data() {
      return {
        safeAreaBottomHeight: 0,
        isNvue: false
      };
    },
    computed: {
      style() {
        const style = {};
        return uni.$u.deepMerge(style, uni.$u.addStyle(this.customStyle));
      }
    },
    mounted() {
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["u-safe-bottom", [!$data.isNvue && "u-safe-area-inset-bottom"]]),
        style: vue.normalizeStyle([$options.style])
      },
      null,
      6
      /* CLASS, STYLE */
    );
  }
  const __easycom_3$1 = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$2], ["__scopeId", "data-v-f3d22cfe"], ["__file", "E:/Uni-App/urshop/uni_modules/uview-plus/components/u-safe-bottom/u-safe-bottom.vue"]]);
  const props = {
    props: {
      // 是否展示弹窗
      show: {
        type: Boolean,
        default: props$g.popup.show
      },
      // 是否显示遮罩
      overlay: {
        type: Boolean,
        default: props$g.popup.overlay
      },
      // 弹出的方向，可选值为 top bottom right left center
      mode: {
        type: String,
        default: props$g.popup.mode
      },
      // 动画时长，单位ms
      duration: {
        type: [String, Number],
        default: props$g.popup.duration
      },
      // 是否显示关闭图标
      closeable: {
        type: Boolean,
        default: props$g.popup.closeable
      },
      // 自定义遮罩的样式
      overlayStyle: {
        type: [Object, String],
        default: props$g.popup.overlayStyle
      },
      // 点击遮罩是否关闭弹窗
      closeOnClickOverlay: {
        type: Boolean,
        default: props$g.popup.closeOnClickOverlay
      },
      // 层级
      zIndex: {
        type: [String, Number],
        default: props$g.popup.zIndex
      },
      // 是否为iPhoneX留出底部安全距离
      safeAreaInsetBottom: {
        type: Boolean,
        default: props$g.popup.safeAreaInsetBottom
      },
      // 是否留出顶部安全距离（状态栏高度）
      safeAreaInsetTop: {
        type: Boolean,
        default: props$g.popup.safeAreaInsetTop
      },
      // 自定义关闭图标位置，top-left为左上角，top-right为右上角，bottom-left为左下角，bottom-right为右下角
      closeIconPos: {
        type: String,
        default: props$g.popup.closeIconPos
      },
      // 是否显示圆角
      round: {
        type: [Boolean, String, Number],
        default: props$g.popup.round
      },
      // mode=center，也即中部弹出时，是否使用缩放模式
      zoom: {
        type: Boolean,
        default: props$g.popup.zoom
      },
      // 弹窗背景色，设置为transparent可去除白色背景
      bgColor: {
        type: String,
        default: props$g.popup.bgColor
      },
      // 遮罩的透明度，0-1之间
      overlayOpacity: {
        type: [Number, String],
        default: props$g.popup.overlayOpacity
      }
    }
  };
  const _sfc_main$8 = {
    name: "u-popup",
    mixins: [mpMixin, mixin, props],
    data() {
      return {
        overlayDuration: this.duration + 50
      };
    },
    watch: {
      show(newValue, oldValue) {
      }
    },
    computed: {
      transitionStyle() {
        const style = {
          zIndex: this.zIndex,
          position: "fixed",
          display: "flex"
        };
        style[this.mode] = 0;
        if (this.mode === "left") {
          return uni.$u.deepMerge(style, {
            bottom: 0,
            top: 0
          });
        } else if (this.mode === "right") {
          return uni.$u.deepMerge(style, {
            bottom: 0,
            top: 0
          });
        } else if (this.mode === "top") {
          return uni.$u.deepMerge(style, {
            left: 0,
            right: 0
          });
        } else if (this.mode === "bottom") {
          return uni.$u.deepMerge(style, {
            left: 0,
            right: 0
          });
        } else if (this.mode === "center") {
          return uni.$u.deepMerge(style, {
            alignItems: "center",
            "justify-content": "center",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          });
        }
      },
      contentStyle() {
        const style = {};
        uni.$u.sys();
        if (this.mode !== "center") {
          style.flex = 1;
        }
        if (this.bgColor) {
          style.backgroundColor = this.bgColor;
        }
        if (this.round) {
          const value = uni.$u.addUnit(this.round);
          if (this.mode === "top") {
            style.borderBottomLeftRadius = value;
            style.borderBottomRightRadius = value;
          } else if (this.mode === "bottom") {
            style.borderTopLeftRadius = value;
            style.borderTopRightRadius = value;
          } else if (this.mode === "center") {
            style.borderRadius = value;
          }
        }
        return uni.$u.deepMerge(style, uni.$u.addStyle(this.customStyle));
      },
      position() {
        if (this.mode === "center") {
          return this.zoom ? "fade-zoom" : "fade";
        }
        if (this.mode === "left") {
          return "slide-left";
        }
        if (this.mode === "right") {
          return "slide-right";
        }
        if (this.mode === "bottom") {
          return "slide-up";
        }
        if (this.mode === "top") {
          return "slide-down";
        }
      }
    },
    methods: {
      // 点击遮罩
      overlayClick() {
        if (this.closeOnClickOverlay) {
          this.$emit("close");
        }
      },
      close(e) {
        this.$emit("close");
      },
      afterEnter() {
        this.$emit("open");
      },
      clickHandler() {
        if (this.mode === "center") {
          this.overlayClick();
        }
        this.$emit("click");
      }
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_overlay = resolveEasycom(vue.resolveDynamicComponent("u-overlay"), __easycom_0);
    const _component_u_status_bar = resolveEasycom(vue.resolveDynamicComponent("u-status-bar"), __easycom_1);
    const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$8);
    const _component_u_safe_bottom = resolveEasycom(vue.resolveDynamicComponent("u-safe-bottom"), __easycom_3$1);
    const _component_u_transition = resolveEasycom(vue.resolveDynamicComponent("u-transition"), __easycom_4);
    return vue.openBlock(), vue.createElementBlock("view", { class: "u-popup" }, [
      _ctx.overlay ? (vue.openBlock(), vue.createBlock(_component_u_overlay, {
        key: 0,
        show: _ctx.show,
        onClick: $options.overlayClick,
        duration: $data.overlayDuration,
        customStyle: _ctx.overlayStyle,
        opacity: _ctx.overlayOpacity
      }, null, 8, ["show", "onClick", "duration", "customStyle", "opacity"])) : vue.createCommentVNode("v-if", true),
      vue.createVNode(_component_u_transition, {
        show: _ctx.show,
        customStyle: $options.transitionStyle,
        mode: $options.position,
        duration: _ctx.duration,
        onAfterEnter: $options.afterEnter,
        onClick: $options.clickHandler
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode(
            "view",
            {
              class: "u-popup__content",
              style: vue.normalizeStyle([$options.contentStyle]),
              onClick: _cache[1] || (_cache[1] = vue.withModifiers((...args) => _ctx.noop && _ctx.noop(...args), ["stop"]))
            },
            [
              _ctx.safeAreaInsetTop ? (vue.openBlock(), vue.createBlock(_component_u_status_bar, { key: 0 })) : vue.createCommentVNode("v-if", true),
              vue.renderSlot(_ctx.$slots, "default", {}, void 0, true),
              _ctx.closeable ? (vue.openBlock(), vue.createElementBlock(
                "view",
                {
                  key: 1,
                  onClick: _cache[0] || (_cache[0] = vue.withModifiers((...args) => $options.close && $options.close(...args), ["stop"])),
                  class: vue.normalizeClass(["u-popup__content__close", ["u-popup__content__close--" + _ctx.closeIconPos]]),
                  "hover-class": "u-popup__content__close--hover",
                  "hover-stay-time": "150"
                },
                [
                  vue.createVNode(_component_u_icon, {
                    name: "close",
                    color: "#909399",
                    size: "18",
                    bold: ""
                  })
                ],
                2
                /* CLASS */
              )) : vue.createCommentVNode("v-if", true),
              _ctx.safeAreaInsetBottom ? (vue.openBlock(), vue.createBlock(_component_u_safe_bottom, { key: 2 })) : vue.createCommentVNode("v-if", true)
            ],
            4
            /* STYLE */
          )
        ]),
        _: 3
        /* FORWARDED */
      }, 8, ["show", "customStyle", "mode", "duration", "onAfterEnter", "onClick"])
    ]);
  }
  const __easycom_3 = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$1], ["__scopeId", "data-v-05c24e9b"], ["__file", "E:/Uni-App/urshop/uni_modules/uview-plus/components/u-popup/u-popup.vue"]]);
  const getbyidList = (params) => {
    return request({
      url: "v1/goods/getbyid",
      params
    });
  };
  const _sfc_main$7 = {
    __name: "detail",
    setup(__props) {
      let swiperList = vue.ref([]);
      let GoodData = vue.ref({});
      let newrolename = vue.ref("");
      let value = vue.ref(10);
      let showData = vue.ref(true);
      vue.ref("");
      const click = (e) => {
        formatAppLog("log", "at pages/detail/detail.vue:123", e);
      };
      const change = (e) => {
      };
      const valChange = (e) => {
        formatAppLog("log", "at pages/detail/detail.vue:127", e);
      };
      const showSku = () => {
        show.value = true;
      };
      const close = () => {
        show.value = false;
      };
      const contactCallback = (e) => {
      };
      const addCart = (e) => {
        formatAppLog("log", "at pages/detail/detail.vue:140", GoodData.value);
        let goodsinfo = GoodData.value;
        let cart = uni.getStorageSync("cart") || [];
        formatAppLog("log", "at pages/detail/detail.vue:143", cart);
        let index2 = cart.findIndex((item) => item.Id == goodsinfo.Id);
        if (index2 !== -1) {
          cart[index2].num++;
        } else {
          goodsinfo.num = 1;
          goodsinfo.checked = true;
          cart.push(goodsinfo);
        }
        uni.setStorageSync("cart", cart);
        uni.showToast({
          icon: "success",
          title: "添加成功"
        });
      };
      const buyBtn = (e) => {
      };
      const goHome = () => {
        wx.switchTab({
          url: "/pages/index/index"
        });
      };
      let show = vue.ref(false);
      let full = vue.ref();
      onLoad(async (option) => {
        formatAppLog("log", "at pages/detail/detail.vue:173", option);
        await Promise.all([
          await getbyidList({ id: option.id })
        ]).then(([res1]) => {
          GoodData.value = res1.Data;
          full.value = GoodData.value.Full.replace(/<img/g, "<image");
          formatAppLog("log", "at pages/detail/detail.vue:181", full.value);
          if (GoodData.value == null) {
            showData.value = false;
          }
          swiperList.value = res1.Data.Pictures;
        }).catch((err) => {
          formatAppLog("log", "at pages/detail/detail.vue:187", err);
          showData.value = false;
        });
      });
      return (_ctx, _cache) => {
        const _component_u_swiper = resolveEasycom(vue.resolveDynamicComponent("u-swiper"), __easycom_0$1);
        const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$8);
        const _component_u_number_box = resolveEasycom(vue.resolveDynamicComponent("u-number-box"), __easycom_2);
        const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_3);
        return vue.unref(showData) ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "container"
        }, [
          vue.createElementVNode("view", { class: "swiper" }, [
            vue.createVNode(_component_u_swiper, {
              height: "750",
              keyName: "BigUrl",
              onClick: click,
              onChange: change,
              list: vue.unref(swiperList)
            }, null, 8, ["list"])
          ]),
          vue.createElementVNode("view", { class: "price-showBox" }, [
            vue.createElementVNode("view", { class: "price-flex" }, [
              vue.createElementVNode(
                "text",
                { class: "price-new" },
                vue.toDisplayString(vue.unref(GoodData).Price),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "text",
                { class: "price-type" },
                "(" + vue.toDisplayString(vue.unref(newrolename) ? vue.unref(newrolename) : "会员") + "价)",
                1
                /* TEXT */
              ),
              vue.unref(GoodData).OldPrice !== "¥0.00" ? (vue.openBlock(), vue.createElementBlock(
                "text",
                {
                  key: 0,
                  class: "price-old"
                },
                vue.toDisplayString(vue.unref(GoodData).OldPrice),
                1
                /* TEXT */
              )) : vue.createCommentVNode("v-if", true),
              vue.createElementVNode("button", {
                "open-type": "share",
                class: "fenx"
              }, [
                vue.createVNode(_component_u_icon, {
                  color: "#930009",
                  name: "share"
                }),
                vue.createTextVNode("分享")
              ])
            ])
          ]),
          vue.createElementVNode(
            "text",
            { class: "title black" },
            vue.toDisplayString(vue.unref(GoodData).Name),
            1
            /* TEXT */
          ),
          vue.createElementVNode("view", { class: "pro-info-foter" }, [
            vue.createElementVNode("view", { class: "info-list" }, [
              vue.createVNode(_component_u_icon, { name: "tags-fill" }),
              vue.createElementVNode(
                "text",
                null,
                "已售: " + vue.toDisplayString(vue.unref(GoodData).SaleVolume),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "info-list" }, [
              vue.createVNode(_component_u_icon, { name: "file-text-fill" }),
              vue.createElementVNode(
                "text",
                null,
                "库存: " + vue.toDisplayString(vue.unref(GoodData).StockQuantity),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "info-list" }, [
              vue.createVNode(_component_u_icon, { name: "car" }),
              vue.createElementVNode("text", null, "广东发货")
            ])
          ]),
          vue.createElementVNode(
            "text",
            {
              class: "pro-Short",
              "wx:if": "{{false}}"
            },
            vue.toDisplayString(vue.unref(GoodData).Short),
            1
            /* TEXT */
          ),
          vue.createElementVNode("view", {
            class: "specs-select",
            onClick: showSku
          }, [
            vue.createElementVNode("text", null, "选择 · 规格"),
            vue.createVNode(_component_u_icon, { name: "arrow-right" })
          ]),
          vue.createVNode(_component_u_popup, {
            show: vue.unref(show),
            onClose: close,
            customStyle: "padding:40rpx 20rpx ;"
          }, {
            default: vue.withCtx(() => [
              vue.createElementVNode("view", null, [
                vue.createElementVNode("view", {
                  class: "item",
                  style: { "margin-bottom": "70rpx" }
                }, [
                  vue.createElementVNode(
                    "view",
                    { style: { "margin-bottom": "30rpx" } },
                    vue.toDisplayString(vue.unref(GoodData).Attrs[0].Name),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { style: { "border": "1rpx solid #ccc", "padding": "10rpx 20rpx", "margin-right": "20rpx" } },
                    vue.toDisplayString(vue.unref(GoodData).Attrs[0].Values[0].Name),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { style: { "border": "1rpx solid #ccc", "padding": "10rpx 20rpx", "margin-right": "20rpx" } },
                    vue.toDisplayString(vue.unref(GoodData).Attrs[0].Values[1].Name),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", {
                  class: "item",
                  style: { "margin-bottom": "70rpx" }
                }, [
                  vue.createElementVNode(
                    "view",
                    { style: { "margin-bottom": "30rpx" } },
                    vue.toDisplayString(vue.unref(GoodData).Attrs[1].Name),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { style: { "border": "1rpx solid #ccc", "padding": "10rpx 20rpx", "margin-right": "20rpx" } },
                    vue.toDisplayString(vue.unref(GoodData).Attrs[1].Values[0].Name),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { style: { "border": "1rpx solid #ccc", "padding": "10rpx 20rpx", "margin-right": "20rpx" } },
                    vue.toDisplayString(vue.unref(GoodData).Attrs[1].Values[1].Name),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", {
                  class: "item",
                  style: { "margin-bottom": "70rpx" }
                }, [
                  vue.createElementVNode("view", null, [
                    vue.createTextVNode(" 数量"),
                    vue.createElementVNode(
                      "text",
                      { style: { "font-size": "15rpx", "color": "#ccc" } },
                      "(库存剩余" + vue.toDisplayString(vue.unref(GoodData).StockQuantity) + ")",
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode("view", { style: { "padding-left": "402rpx", "height": "60rpx" } }, [
                    vue.createVNode(_component_u_number_box, {
                      style: { "border": "1rpx solid #848484", "height": "60rpx", "justify-content": "space-between" },
                      iconStyle: " padding:22rpx 22rpx ; border: 1rpx solid #848484; backgroundColor:#ccc;",
                      "button-size": "40",
                      bgColor: "#fff",
                      min: 1,
                      max: 100,
                      modelValue: vue.unref(value),
                      "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => vue.isRef(value) ? value.value = $event : value = $event),
                      onChange: valChange
                    }, null, 8, ["modelValue"])
                  ])
                ]),
                vue.createElementVNode("view", {
                  class: "item",
                  style: { "margin-bottom": "100rpx" }
                }, [
                  vue.createElementVNode("view", null, " 价格 "),
                  vue.createElementVNode("text", { style: { "position": "absolute", "right": "20rpx", "color": "red" } }, "￥")
                ])
              ])
            ]),
            _: 1
            /* STABLE */
          }, 8, ["show"]),
          vue.createElementVNode("view", { class: "product_con" }, [
            vue.createElementVNode("rich-text", {
              nodes: vue.unref(GoodData).Full
            }, null, 8, ["nodes"]),
            vue.createCommentVNode(' <view v-html="full"></view> ')
          ]),
          vue.createCommentVNode(" 固定底部 "),
          vue.createElementVNode("view", { class: "buy_footer" }, [
            vue.createElementVNode("view", {
              class: "list collect",
              onClick: goHome
            }, [
              vue.createVNode(_component_u_icon, {
                size: "40",
                name: "kefu-ermai"
              }),
              vue.createElementVNode("text", { class: "ft-text" }, "客服"),
              vue.createElementVNode(
                "button",
                {
                  "open-type": "contact",
                  class: "kefu-btn",
                  onContact: contactCallback
                },
                null,
                32
                /* HYDRATE_EVENTS */
              )
            ]),
            vue.createElementVNode("view", {
              class: "list collect",
              onClick: goHome
            }, [
              vue.createVNode(_component_u_icon, {
                size: "40",
                name: "home"
              }),
              vue.createElementVNode("text", { class: "ft-text" }, "首页")
            ]),
            vue.createElementVNode("navigator", {
              "open-type": "switchTab",
              url: "/pages/cart/cart",
              class: "list cart"
            }, [
              vue.createVNode(_component_u_icon, {
                size: "40",
                name: "shopping-cart"
              }),
              vue.createElementVNode("text", { class: "ft-text" }, "购物车"),
              vue.createElementVNode("text", { class: "cart-numb" }, "0")
            ]),
            vue.unref(GoodData).Published && vue.unref(GoodData).StockQuantity != 0 ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "footr-butn"
            }, [
              vue.createElementVNode("button", {
                type: "button",
                class: "btn-cart",
                onClick: addCart
              }, "加入购物车"),
              vue.createElementVNode("button", {
                type: "button",
                class: "btn-buy",
                onClick: buyBtn
              }, "立即购买")
            ])) : vue.createCommentVNode("v-if", true),
            !vue.unref(GoodData).Published && vue.unref(GoodData).StockQuantity == 0 ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "footr-butn"
            }, [
              vue.createElementVNode("button", {
                type: "button",
                class: "jjkm"
              }, "商品已售罄")
            ])) : vue.createCommentVNode("v-if", true),
            !vue.unref(GoodData).Published && vue.unref(GoodData).StockQuantity != 0 ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 2,
              class: "footr-butn"
            }, [
              vue.createElementVNode("button", {
                type: "button",
                class: "jjkm"
              }, "商品已下架")
            ])) : vue.createCommentVNode("v-if", true),
            vue.unref(GoodData).Published && vue.unref(GoodData).StockQuantity == 0 ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 3,
              class: "footr-butn"
            }, [
              vue.createElementVNode("button", {
                type: "button",
                class: "jjkm"
              }, "商品即将开卖")
            ])) : vue.createCommentVNode("v-if", true)
          ])
        ])) : (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "container"
        }, [
          vue.createElementVNode("h1", null, "商品已下架")
        ]));
      };
    }
  };
  const PagesDetailDetail = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["__scopeId", "data-v-eca06f3c"], ["__file", "E:/Uni-App/urshop/pages/detail/detail.vue"]]);
  const _sfc_main$6 = {
    __name: "order",
    setup(__props) {
      let activeTab = vue.ref("全部");
      let productlist = vue.ref([]);
      const changeTab = (tab) => {
        activeTab.value = tab;
      };
      onLoad(async () => {
        const res = await getAProductList({
          cid: 105,
          size: 20
        });
        productlist.value = res.Data.Items;
        formatAppLog("log", "at pages/order/order.vue:63", productlist.value);
      });
      return (_ctx, _cache) => {
        const _component_u_button = resolveEasycom(vue.resolveDynamicComponent("u-button"), __easycom_0$5);
        return vue.openBlock(), vue.createElementBlock("view", { class: "order" }, [
          vue.createElementVNode("view", { class: "tabs" }, [
            vue.createElementVNode(
              "div",
              {
                class: vue.normalizeClass(["item", { "active": vue.unref(activeTab) === "全部" }]),
                onClick: _cache[0] || (_cache[0] = ($event) => changeTab("全部"))
              },
              "全部",
              2
              /* CLASS */
            ),
            vue.createElementVNode(
              "div",
              {
                class: vue.normalizeClass(["item", { "active": vue.unref(activeTab) === "待付款" }]),
                onClick: _cache[1] || (_cache[1] = ($event) => changeTab("待付款"))
              },
              "待付款",
              2
              /* CLASS */
            ),
            vue.createElementVNode(
              "div",
              {
                class: vue.normalizeClass(["item", { "active": vue.unref(activeTab) === "待配送" }]),
                onClick: _cache[2] || (_cache[2] = ($event) => changeTab("待配送"))
              },
              "待配送",
              2
              /* CLASS */
            ),
            vue.createElementVNode(
              "div",
              {
                class: vue.normalizeClass(["item", { "active": vue.unref(activeTab) === "待收获" }]),
                onClick: _cache[3] || (_cache[3] = ($event) => changeTab("待收获"))
              },
              "待收获",
              2
              /* CLASS */
            ),
            vue.createElementVNode(
              "div",
              {
                class: vue.normalizeClass(["item", { "active": vue.unref(activeTab) === "已收货" }]),
                onClick: _cache[4] || (_cache[4] = ($event) => changeTab("已收货"))
              },
              "已收货",
              2
              /* CLASS */
            )
          ]),
          vue.createElementVNode("view", { class: "con" }, [
            vue.createElementVNode("view", { class: "product-view2" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(vue.unref(productlist), (item, index2) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    class: "product-view2-item",
                    key: index2
                  }, [
                    vue.createElementVNode("navigator", {
                      url: `/pages/detail/detail?id=${item.Id}`,
                      class: "product-view2-box"
                    }, [
                      vue.createElementVNode("view", { class: "product-img" }, [
                        vue.createElementVNode("image", {
                          src: item.Picture.NormalUrl
                        }, null, 8, ["src"])
                      ]),
                      vue.createElementVNode("view", { class: "pruduct-info" }, [
                        vue.createElementVNode("view", { class: "product-t" }, [
                          vue.createElementVNode("span", {
                            class: "product-name",
                            "data-detailId": item.Id
                          }, vue.toDisplayString(item.Name), 9, ["data-detailId"]),
                          vue.createElementVNode("span", {
                            class: "product-srot",
                            "data-detailId": item.Id
                          }, vue.toDisplayString(item.Short), 9, ["data-detailId"])
                        ]),
                        vue.createElementVNode("view", { class: "price" }, [
                          vue.createElementVNode(
                            "span",
                            { class: "product-price price-color" },
                            vue.toDisplayString(item.Price.Price),
                            1
                            /* TEXT */
                          ),
                          item.Price.OldPrice !== "¥0.00" ? (vue.openBlock(), vue.createElementBlock(
                            "span",
                            {
                              key: 0,
                              class: "product-oldprice"
                            },
                            vue.toDisplayString(item.Price.OldPrice),
                            1
                            /* TEXT */
                          )) : vue.createCommentVNode("v-if", true)
                        ])
                      ])
                    ], 8, ["url"]),
                    vue.createElementVNode("view", { class: "btn" }, [
                      vue.createCommentVNode(" 11 "),
                      vue.createVNode(_component_u_button, {
                        plain: "",
                        text: "加入购物车",
                        color: "#950000"
                      }),
                      vue.createVNode(_component_u_button, {
                        text: "删除商品",
                        color: "#950000"
                      })
                    ])
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ])
        ]);
      };
    }
  };
  const PagesOrderOrder = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["__scopeId", "data-v-93207a4f"], ["__file", "E:/Uni-App/urshop/pages/order/order.vue"]]);
  const _sfc_main$5 = {};
  function _sfc_render(_ctx, _cache) {
    const _component_u_icon = resolveEasycom(vue.resolveDynamicComponent("u-icon"), __easycom_0$8);
    return vue.openBlock(), vue.createElementBlock("view", null, [
      vue.createVNode(_component_u_icon, {
        name: "order",
        color: "#999",
        size: "300",
        label: "暂时没有退货订单",
        "label-pos": "bottom",
        labelSize: "50"
      })
    ]);
  }
  const PagesOrderListOrderList = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render], ["__file", "E:/Uni-App/urshop/pages/orderList/orderList.vue"]]);
  const _sfc_main$4 = {
    __name: "address",
    setup(__props) {
      vue.ref([]);
      let formdata = vue.ref({});
      const nav = () => {
        uni.navigateTo({
          url: "../address-editor/address-editor"
        });
      };
      onLoad((option) => {
        formatAppLog("log", "at pages/address/address.vue:36", option);
        if (Object.keys(option).length !== 0) {
          formdata.value = {
            name: option.name,
            phone: option.phone,
            address: option.address,
            addressDetail: option.addressDetail
          };
        }
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock(
          vue.Fragment,
          null,
          [
            Object.keys(vue.unref(formdata)).length === 0 ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "address"
            }, [
              vue.createElementVNode("view", { class: "txt" }, "暂无收货人信息")
            ])) : vue.createCommentVNode("v-if", true),
            Object.keys(vue.unref(formdata)).length !== 0 ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "address"
            }, [
              vue.createElementVNode(
                "view",
                { class: "name" },
                " 收货人：" + vue.toDisplayString(vue.unref(formdata).name),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "view",
                { class: "name" },
                " 手机号码：" + vue.toDisplayString(vue.unref(formdata).phone),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "view",
                { class: "name" },
                " 地区：" + vue.toDisplayString(vue.unref(formdata).address),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "view",
                { class: "name" },
                " 详细地址：" + vue.toDisplayString(vue.unref(formdata).addressDetail),
                1
                /* TEXT */
              )
            ])) : vue.createCommentVNode("v-if", true),
            vue.createElementVNode("view", { class: "button" }, [
              vue.createElementVNode("button", { onClick: nav }, "添加收货人信息")
            ])
          ],
          64
          /* STABLE_FRAGMENT */
        );
      };
    }
  };
  const PagesAddressAddress = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["__scopeId", "data-v-40ca010a"], ["__file", "E:/Uni-App/urshop/pages/address/address.vue"]]);
  const _sfc_main$3 = {
    __name: "question",
    setup(__props) {
      let data = vue.ref();
      onLoad(async (option) => {
        const res = await getAboutus({ systemName: option.name });
        data.value = res.Data.Body;
        uni.setNavigationBarTitle({
          title: res.Data.Title
        });
      });
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", null, [
          vue.createElementVNode("rich-text", { nodes: vue.unref(data) }, null, 8, ["nodes"])
        ]);
      };
    }
  };
  const PagesQuestionQuestion = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-a6df9a91"], ["__file", "E:/Uni-App/urshop/pages/question/question.vue"]]);
  const _sfc_main$2 = {
    __name: "address-editor",
    setup(__props) {
      const formSubmit = (e) => {
        if (e.detail.value.phone.length !== 11) {
          uni.showToast({
            icon: "error",
            title: "手机号码格式不对"
          });
          return;
        }
        if (e.detail.value.name.length == 0) {
          uni.showToast({
            icon: "error",
            title: "姓名不能为空"
          });
          return;
        }
        let formdata = e.detail.value;
        formatAppLog("log", "at pages/address-editor/address-editor.vue:53", formdata);
        uni.navigateTo({
          url: `../address/address?name=${formdata.name}&address=${formdata.address}&phone=${formdata.phone}&addressDetail=${formdata.addressDetai}&`
        });
      };
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("view", null, [
          vue.createElementVNode("view", { class: "form" }, [
            vue.createElementVNode(
              "form",
              { onSubmit: formSubmit },
              [
                vue.createElementVNode("view", { class: "uni-form-item uni-column" }, [
                  vue.createElementVNode("view", { class: "title" }, "收货人："),
                  vue.createElementVNode("input", {
                    class: "uni-input",
                    name: "name",
                    placeholder: "请输入收货人姓名"
                  })
                ]),
                vue.createElementVNode("view", { class: "uni-form-item uni-column" }, [
                  vue.createElementVNode("view", { class: "title" }, "手机号码："),
                  vue.createElementVNode("input", {
                    class: "uni-input",
                    name: "phone",
                    placeholder: "请输入手机号码"
                  })
                ]),
                vue.createElementVNode("view", { class: "uni-form-item uni-column" }, [
                  vue.createElementVNode("view", { class: "title" }, "地区："),
                  vue.createElementVNode("input", {
                    class: "uni-input",
                    name: "address",
                    placeholder: "请选择所在地区"
                  })
                ]),
                vue.createElementVNode("view", { class: "uni-form-item uni-column" }, [
                  vue.createElementVNode("view", { class: "title" }, "详细地址："),
                  vue.createElementVNode("input", {
                    class: "uni-input",
                    name: "addressDetail",
                    placeholder: "请输入详细地址"
                  })
                ]),
                vue.createElementVNode("view", { class: "uni-btn-v" }, [
                  vue.createElementVNode("button", {
                    class: "btn",
                    "form-type": "submit"
                  }, "添加"),
                  vue.createCommentVNode(' <button type="default" form-type="reset">Reset</button> ')
                ])
              ],
              32
              /* HYDRATE_EVENTS */
            )
          ])
        ]);
      };
    }
  };
  const PagesAddressEditorAddressEditor = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-4e9cc4f4"], ["__file", "E:/Uni-App/urshop/pages/address-editor/address-editor.vue"]]);
  const _sfc_main$1 = {
    __name: "search",
    setup(__props) {
      let searchContent = vue.ref([]);
      let page2 = vue.ref(1);
      const keyword = vue.ref("");
      const search = async (val) => {
        formatAppLog("log", "at pages/search/search.vue:35", val);
        const res = await getSearch({ q: val, page: page2.value });
        searchContent.value = res.Data.Items;
        formatAppLog("log", "at pages/search/search.vue:38", searchContent.value);
      };
      const searchLower = async () => {
        page2.value++;
        const res = await getSearch({ q: keyword.value, page: page2.value });
        searchContent.value = [...searchContent.value, ...res.Data.Items];
        formatAppLog("log", "at pages/search/search.vue:45", searchContent.value);
      };
      onLoad((option) => {
        keyword.value = option.value;
        search(keyword.value);
      });
      return (_ctx, _cache) => {
        const _component_u_search = resolveEasycom(vue.resolveDynamicComponent("u-search"), __easycom_0$4);
        return vue.openBlock(), vue.createElementBlock("view", null, [
          vue.createElementVNode("view", { class: "search" }, [
            vue.createVNode(_component_u_search, {
              onSearch: search,
              bgColor: "#fff",
              "show-action": false,
              clearabled: true,
              shape: "round",
              placeholder: "搜一搜",
              modelValue: keyword.value,
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => keyword.value = $event)
            }, null, 8, ["modelValue"])
          ]),
          vue.unref(searchContent).length !== 0 ? (vue.openBlock(), vue.createElementBlock(
            "scroll-view",
            {
              key: 0,
              "scroll-y": "",
              class: "search-scroll",
              onScrolltolower: searchLower
            },
            [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(vue.unref(searchContent), (item, index2) => {
                  return vue.openBlock(), vue.createElementBlock("view", { key: index2 }, [
                    vue.createElementVNode("navigator", {
                      class: "sear-cont",
                      url: `/pages/detail/detail?id=${item.Id}`
                    }, [
                      vue.createElementVNode("view", { class: "sear-img" }, [
                        vue.createElementVNode("image", {
                          src: item.Picture.NormalUrl
                        }, null, 8, ["src"])
                      ]),
                      vue.createElementVNode("view", { class: "sear-info" }, [
                        vue.createElementVNode(
                          "text",
                          { class: "sear-name" },
                          vue.toDisplayString(item.Name),
                          1
                          /* TEXT */
                        ),
                        vue.createElementVNode(
                          "text",
                          { class: "sear-sale" },
                          "售出：" + vue.toDisplayString(item.SaleVolume),
                          1
                          /* TEXT */
                        ),
                        vue.createElementVNode(
                          "text",
                          { class: "sear-price price-color" },
                          vue.toDisplayString(item.Price.Price),
                          1
                          /* TEXT */
                        )
                      ])
                    ], 8, ["url"])
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              )),
              vue.unref(searchContent).length == 0 ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "sear-nofind"
              }, [
                vue.createElementVNode("text", null, "找不到该商品")
              ])) : vue.createCommentVNode("v-if", true)
            ],
            32
            /* HYDRATE_EVENTS */
          )) : vue.createCommentVNode("v-if", true)
        ]);
      };
    }
  };
  const PagesSearchSearch = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-c10c040c"], ["__file", "E:/Uni-App/urshop/pages/search/search.vue"]]);
  __definePage("pages/Login/Login", PagesLoginLogin);
  __definePage("pages/index/index", PagesIndexIndex);
  __definePage("pages/category/category", PagesCategoryCategory);
  __definePage("pages/cart/cart", PagesCartCart);
  __definePage("pages/mine/mine", PagesMineMine);
  __definePage("pages/options/options", PagesOptionsOptions);
  __definePage("pages/subcategory/subcategory", PagesSubcategorySubcategory);
  __definePage("pages/detail/detail", PagesDetailDetail);
  __definePage("pages/order/order", PagesOrderOrder);
  __definePage("pages/orderList/orderList", PagesOrderListOrderList);
  __definePage("pages/address/address", PagesAddressAddress);
  __definePage("pages/question/question", PagesQuestionQuestion);
  __definePage("pages/address-editor/address-editor", PagesAddressEditorAddressEditor);
  __definePage("pages/search/search", PagesSearchSearch);
  const whiteList = [
    // 注意入口页必须直接写 '/'
    // 支持正则表达式   { pattern: /^\/pages\/list.*/ }, 
    "/pages/Login/Login"
  ];
  async function routingIntercept() {
    const list = ["navigateTo", "redirectTo", "reLaunch", "switchTab"];
    list.forEach((item) => {
      uni.addInterceptor(item, {
        invoke(e) {
          let authorization = uni.getStorageSync("token");
          const url2 = e.url.split("?")[0];
          if (!authorization) {
            formatAppLog("log", "at permission.js:24", "没有token");
            let pass;
            if (whiteList) {
              pass = whiteList.some((item2) => {
                if (typeof item2 === "object" && item2.pattern) {
                  return item2.pattern.test(url2);
                }
                return url2 === item2;
              });
            }
            if (!pass) {
              uni.redirectTo({
                url: "/pages/Login/Login"
              });
              return false;
            }
          }
          formatAppLog("log", "at permission.js:44", "存在token");
          return e;
        },
        fail(err) {
          formatAppLog("log", "at permission.js:48", err);
        }
      });
    });
  }
  const _sfc_main = {
    onLaunch: function() {
      routingIntercept();
      formatAppLog("log", "at App.vue:7", 111);
    },
    onShow: function() {
    },
    onHide: function() {
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "E:/Uni-App/urshop/App.vue"]]);
  const { toString } = Object.prototype;
  function isArray(val) {
    return toString.call(val) === "[object Array]";
  }
  function isObject$1(val) {
    return val !== null && typeof val === "object";
  }
  function isDate(val) {
    return toString.call(val) === "[object Date]";
  }
  function isURLSearchParams(val) {
    return typeof URLSearchParams !== "undefined" && val instanceof URLSearchParams;
  }
  function forEach(obj, fn) {
    if (obj === null || typeof obj === "undefined") {
      return;
    }
    if (typeof obj !== "object") {
      obj = [obj];
    }
    if (isArray(obj)) {
      for (let i2 = 0, l2 = obj.length; i2 < l2; i2++) {
        fn.call(null, obj[i2], i2, obj);
      }
    } else {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          fn.call(null, obj[key], key, obj);
        }
      }
    }
  }
  function isPlainObject(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]";
  }
  function deepMerge$1() {
    const result = {};
    function assignValue(val, key) {
      if (typeof result[key] === "object" && typeof val === "object") {
        result[key] = deepMerge$1(result[key], val);
      } else if (typeof val === "object") {
        result[key] = deepMerge$1({}, val);
      } else {
        result[key] = val;
      }
    }
    for (let i2 = 0, l2 = arguments.length; i2 < l2; i2++) {
      forEach(arguments[i2], assignValue);
    }
    return result;
  }
  function isUndefined(val) {
    return typeof val === "undefined";
  }
  function encode(val) {
    return encodeURIComponent(val).replace(/%40/gi, "@").replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+").replace(/%5B/gi, "[").replace(/%5D/gi, "]");
  }
  function buildURL(url2, params) {
    if (!params) {
      return url2;
    }
    let serializedParams;
    if (isURLSearchParams(params)) {
      serializedParams = params.toString();
    } else {
      const parts = [];
      forEach(params, (val, key) => {
        if (val === null || typeof val === "undefined") {
          return;
        }
        if (isArray(val)) {
          key = `${key}[]`;
        } else {
          val = [val];
        }
        forEach(val, (v2) => {
          if (isDate(v2)) {
            v2 = v2.toISOString();
          } else if (isObject$1(v2)) {
            v2 = JSON.stringify(v2);
          }
          parts.push(`${encode(key)}=${encode(v2)}`);
        });
      });
      serializedParams = parts.join("&");
    }
    if (serializedParams) {
      const hashmarkIndex = url2.indexOf("#");
      if (hashmarkIndex !== -1) {
        url2 = url2.slice(0, hashmarkIndex);
      }
      url2 += (url2.indexOf("?") === -1 ? "?" : "&") + serializedParams;
    }
    return url2;
  }
  function isAbsoluteURL(url2) {
    return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url2);
  }
  function combineURLs(baseURL, relativeURL) {
    return relativeURL ? `${baseURL.replace(/\/+$/, "")}/${relativeURL.replace(/^\/+/, "")}` : baseURL;
  }
  function buildFullPath(baseURL, requestedURL) {
    if (baseURL && !isAbsoluteURL(requestedURL)) {
      return combineURLs(baseURL, requestedURL);
    }
    return requestedURL;
  }
  function settle(resolve, reject, response) {
    const { validateStatus } = response.config;
    const status = response.statusCode;
    if (status && (!validateStatus || validateStatus(status))) {
      resolve(response);
    } else {
      reject(response);
    }
  }
  const mergeKeys$1 = (keys, config2) => {
    const config3 = {};
    keys.forEach((prop) => {
      if (!isUndefined(config2[prop])) {
        config3[prop] = config2[prop];
      }
    });
    return config3;
  };
  const adapter = (config2) => new Promise((resolve, reject) => {
    const fullPath = buildURL(buildFullPath(config2.baseURL, config2.url), config2.params);
    const _config = {
      url: fullPath,
      header: config2.header,
      complete: (response) => {
        config2.fullPath = fullPath;
        response.config = config2;
        try {
          if (typeof response.data === "string") {
            response.data = JSON.parse(response.data);
          }
        } catch (e) {
        }
        settle(resolve, reject, response);
      }
    };
    let requestTask;
    if (config2.method === "UPLOAD") {
      delete _config.header["content-type"];
      delete _config.header["Content-Type"];
      const otherConfig = {
        filePath: config2.filePath,
        name: config2.name
      };
      const optionalKeys = [
        "files",
        "timeout",
        "formData"
      ];
      requestTask = uni.uploadFile({ ..._config, ...otherConfig, ...mergeKeys$1(optionalKeys, config2) });
    } else if (config2.method === "DOWNLOAD") {
      if (!isUndefined(config2.timeout)) {
        _config.timeout = config2.timeout;
      }
      requestTask = uni.downloadFile(_config);
    } else {
      const optionalKeys = [
        "data",
        "method",
        "timeout",
        "dataType",
        "responseType",
        "sslVerify",
        "firstIpv4"
      ];
      requestTask = uni.request({ ..._config, ...mergeKeys$1(optionalKeys, config2) });
    }
    if (config2.getTask) {
      config2.getTask(requestTask, config2);
    }
  });
  const dispatchRequest = (config2) => adapter(config2);
  function InterceptorManager() {
    this.handlers = [];
  }
  InterceptorManager.prototype.use = function use(fulfilled, rejected) {
    this.handlers.push({
      fulfilled,
      rejected
    });
    return this.handlers.length - 1;
  };
  InterceptorManager.prototype.eject = function eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  };
  InterceptorManager.prototype.forEach = function forEach2(fn) {
    this.handlers.forEach((h2) => {
      if (h2 !== null) {
        fn(h2);
      }
    });
  };
  const mergeKeys = (keys, globalsConfig, config2) => {
    const config3 = {};
    keys.forEach((prop) => {
      if (!isUndefined(config2[prop])) {
        config3[prop] = config2[prop];
      } else if (!isUndefined(globalsConfig[prop])) {
        config3[prop] = globalsConfig[prop];
      }
    });
    return config3;
  };
  const mergeConfig = (globalsConfig, config2 = {}) => {
    const method = config2.method || globalsConfig.method || "GET";
    let config3 = {
      baseURL: globalsConfig.baseURL || "",
      method,
      url: config2.url || "",
      params: config2.params || {},
      custom: { ...globalsConfig.custom || {}, ...config2.custom || {} },
      header: deepMerge$1(globalsConfig.header || {}, config2.header || {})
    };
    const defaultToConfig2Keys = ["getTask", "validateStatus"];
    config3 = { ...config3, ...mergeKeys(defaultToConfig2Keys, globalsConfig, config2) };
    if (method === "DOWNLOAD") {
      if (!isUndefined(config2.timeout)) {
        config3.timeout = config2.timeout;
      } else if (!isUndefined(globalsConfig.timeout)) {
        config3.timeout = globalsConfig.timeout;
      }
    } else if (method === "UPLOAD") {
      delete config3.header["content-type"];
      delete config3.header["Content-Type"];
      const uploadKeys = [
        "files",
        "filePath",
        "name",
        "timeout",
        "formData"
      ];
      uploadKeys.forEach((prop) => {
        if (!isUndefined(config2[prop])) {
          config3[prop] = config2[prop];
        }
      });
      if (isUndefined(config3.timeout) && !isUndefined(globalsConfig.timeout)) {
        config3.timeout = globalsConfig.timeout;
      }
    } else {
      const defaultsKeys = [
        "data",
        "timeout",
        "dataType",
        "responseType",
        "sslVerify",
        "firstIpv4"
      ];
      config3 = { ...config3, ...mergeKeys(defaultsKeys, globalsConfig, config2) };
    }
    return config3;
  };
  const defaults = {
    baseURL: "",
    header: {},
    method: "GET",
    dataType: "json",
    responseType: "text",
    custom: {},
    timeout: 6e4,
    sslVerify: true,
    firstIpv4: false,
    validateStatus: function validateStatus(status) {
      return status >= 200 && status < 300;
    }
  };
  var clone = function() {
    function _instanceof(obj, type) {
      return type != null && obj instanceof type;
    }
    var nativeMap;
    try {
      nativeMap = Map;
    } catch (_2) {
      nativeMap = function() {
      };
    }
    var nativeSet;
    try {
      nativeSet = Set;
    } catch (_2) {
      nativeSet = function() {
      };
    }
    var nativePromise;
    try {
      nativePromise = Promise;
    } catch (_2) {
      nativePromise = function() {
      };
    }
    function clone2(parent, circular, depth, prototype, includeNonEnumerable) {
      if (typeof circular === "object") {
        depth = circular.depth;
        prototype = circular.prototype;
        includeNonEnumerable = circular.includeNonEnumerable;
        circular = circular.circular;
      }
      var allParents = [];
      var allChildren = [];
      var useBuffer = typeof Buffer != "undefined";
      if (typeof circular == "undefined")
        circular = true;
      if (typeof depth == "undefined")
        depth = Infinity;
      function _clone(parent2, depth2) {
        if (parent2 === null)
          return null;
        if (depth2 === 0)
          return parent2;
        var child;
        var proto;
        if (typeof parent2 != "object") {
          return parent2;
        }
        if (_instanceof(parent2, nativeMap)) {
          child = new nativeMap();
        } else if (_instanceof(parent2, nativeSet)) {
          child = new nativeSet();
        } else if (_instanceof(parent2, nativePromise)) {
          child = new nativePromise(function(resolve, reject) {
            parent2.then(function(value) {
              resolve(_clone(value, depth2 - 1));
            }, function(err) {
              reject(_clone(err, depth2 - 1));
            });
          });
        } else if (clone2.__isArray(parent2)) {
          child = [];
        } else if (clone2.__isRegExp(parent2)) {
          child = new RegExp(parent2.source, __getRegExpFlags(parent2));
          if (parent2.lastIndex)
            child.lastIndex = parent2.lastIndex;
        } else if (clone2.__isDate(parent2)) {
          child = new Date(parent2.getTime());
        } else if (useBuffer && Buffer.isBuffer(parent2)) {
          if (Buffer.from) {
            child = Buffer.from(parent2);
          } else {
            child = new Buffer(parent2.length);
            parent2.copy(child);
          }
          return child;
        } else if (_instanceof(parent2, Error)) {
          child = Object.create(parent2);
        } else {
          if (typeof prototype == "undefined") {
            proto = Object.getPrototypeOf(parent2);
            child = Object.create(proto);
          } else {
            child = Object.create(prototype);
            proto = prototype;
          }
        }
        if (circular) {
          var index2 = allParents.indexOf(parent2);
          if (index2 != -1) {
            return allChildren[index2];
          }
          allParents.push(parent2);
          allChildren.push(child);
        }
        if (_instanceof(parent2, nativeMap)) {
          parent2.forEach(function(value, key) {
            var keyChild = _clone(key, depth2 - 1);
            var valueChild = _clone(value, depth2 - 1);
            child.set(keyChild, valueChild);
          });
        }
        if (_instanceof(parent2, nativeSet)) {
          parent2.forEach(function(value) {
            var entryChild = _clone(value, depth2 - 1);
            child.add(entryChild);
          });
        }
        for (var i2 in parent2) {
          var attrs = Object.getOwnPropertyDescriptor(parent2, i2);
          if (attrs) {
            child[i2] = _clone(parent2[i2], depth2 - 1);
          }
          try {
            var objProperty = Object.getOwnPropertyDescriptor(parent2, i2);
            if (objProperty.set === "undefined") {
              continue;
            }
            child[i2] = _clone(parent2[i2], depth2 - 1);
          } catch (e) {
            if (e instanceof TypeError) {
              continue;
            } else if (e instanceof ReferenceError) {
              continue;
            }
          }
        }
        if (Object.getOwnPropertySymbols) {
          var symbols = Object.getOwnPropertySymbols(parent2);
          for (var i2 = 0; i2 < symbols.length; i2++) {
            var symbol = symbols[i2];
            var descriptor = Object.getOwnPropertyDescriptor(parent2, symbol);
            if (descriptor && !descriptor.enumerable && !includeNonEnumerable) {
              continue;
            }
            child[symbol] = _clone(parent2[symbol], depth2 - 1);
            Object.defineProperty(child, symbol, descriptor);
          }
        }
        if (includeNonEnumerable) {
          var allPropertyNames = Object.getOwnPropertyNames(parent2);
          for (var i2 = 0; i2 < allPropertyNames.length; i2++) {
            var propertyName = allPropertyNames[i2];
            var descriptor = Object.getOwnPropertyDescriptor(parent2, propertyName);
            if (descriptor && descriptor.enumerable) {
              continue;
            }
            child[propertyName] = _clone(parent2[propertyName], depth2 - 1);
            Object.defineProperty(child, propertyName, descriptor);
          }
        }
        return child;
      }
      return _clone(parent, depth);
    }
    clone2.clonePrototype = function clonePrototype(parent) {
      if (parent === null)
        return null;
      var c2 = function() {
      };
      c2.prototype = parent;
      return new c2();
    };
    function __objToStr(o2) {
      return Object.prototype.toString.call(o2);
    }
    clone2.__objToStr = __objToStr;
    function __isDate(o2) {
      return typeof o2 === "object" && __objToStr(o2) === "[object Date]";
    }
    clone2.__isDate = __isDate;
    function __isArray(o2) {
      return typeof o2 === "object" && __objToStr(o2) === "[object Array]";
    }
    clone2.__isArray = __isArray;
    function __isRegExp(o2) {
      return typeof o2 === "object" && __objToStr(o2) === "[object RegExp]";
    }
    clone2.__isRegExp = __isRegExp;
    function __getRegExpFlags(re2) {
      var flags = "";
      if (re2.global)
        flags += "g";
      if (re2.ignoreCase)
        flags += "i";
      if (re2.multiline)
        flags += "m";
      return flags;
    }
    clone2.__getRegExpFlags = __getRegExpFlags;
    return clone2;
  }();
  class Request {
    /**
    * @param {Object} arg - 全局配置
    * @param {String} arg.baseURL - 全局根路径
    * @param {Object} arg.header - 全局header
    * @param {String} arg.method = [GET|POST|PUT|DELETE|CONNECT|HEAD|OPTIONS|TRACE] - 全局默认请求方式
    * @param {String} arg.dataType = [json] - 全局默认的dataType
    * @param {String} arg.responseType = [text|arraybuffer] - 全局默认的responseType。支付宝小程序不支持
    * @param {Object} arg.custom - 全局默认的自定义参数
    * @param {Number} arg.timeout - 全局默认的超时时间，单位 ms。默认60000。H5(HBuilderX 2.9.9+)、APP(HBuilderX 2.9.9+)、微信小程序（2.10.0）、支付宝小程序
    * @param {Boolean} arg.sslVerify - 全局默认的是否验证 ssl 证书。默认true.仅App安卓端支持（HBuilderX 2.3.3+）
    * @param {Boolean} arg.withCredentials - 全局默认的跨域请求时是否携带凭证（cookies）。默认false。仅H5支持（HBuilderX 2.6.15+）
    * @param {Boolean} arg.firstIpv4 - 全DNS解析时优先使用ipv4。默认false。仅 App-Android 支持 (HBuilderX 2.8.0+)
    * @param {Function(statusCode):Boolean} arg.validateStatus - 全局默认的自定义验证器。默认statusCode >= 200 && statusCode < 300
    */
    constructor(arg = {}) {
      if (!isPlainObject(arg)) {
        arg = {};
        formatAppLog("warn", "at uni_modules/uview-plus/libs/luch-request/core/Request.js:39", "设置全局参数必须接收一个Object");
      }
      this.config = clone({ ...defaults, ...arg });
      this.interceptors = {
        request: new InterceptorManager(),
        response: new InterceptorManager()
      };
    }
    /**
    * @Function
    * @param {Request~setConfigCallback} f - 设置全局默认配置
    */
    setConfig(f2) {
      this.config = f2(this.config);
    }
    middleware(config2) {
      config2 = mergeConfig(this.config, config2);
      const chain = [dispatchRequest, void 0];
      let promise2 = Promise.resolve(config2);
      this.interceptors.request.forEach((interceptor) => {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });
      this.interceptors.response.forEach((interceptor) => {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });
      while (chain.length) {
        promise2 = promise2.then(chain.shift(), chain.shift());
      }
      return promise2;
    }
    /**
    * @Function
    * @param {Object} config - 请求配置项
    * @prop {String} options.url - 请求路径
    * @prop {Object} options.data - 请求参数
    * @prop {Object} [options.responseType = config.responseType] [text|arraybuffer] - 响应的数据类型
    * @prop {Object} [options.dataType = config.dataType] - 如果设为 json，会尝试对返回的数据做一次 JSON.parse
    * @prop {Object} [options.header = config.header] - 请求header
    * @prop {Object} [options.method = config.method] - 请求方法
    * @returns {Promise<unknown>}
    */
    request(config2 = {}) {
      return this.middleware(config2);
    }
    get(url2, options = {}) {
      return this.middleware({
        url: url2,
        method: "GET",
        ...options
      });
    }
    post(url2, data, options = {}) {
      return this.middleware({
        url: url2,
        data,
        method: "POST",
        ...options
      });
    }
    put(url2, data, options = {}) {
      return this.middleware({
        url: url2,
        data,
        method: "PUT",
        ...options
      });
    }
    delete(url2, data, options = {}) {
      return this.middleware({
        url: url2,
        data,
        method: "DELETE",
        ...options
      });
    }
    options(url2, data, options = {}) {
      return this.middleware({
        url: url2,
        data,
        method: "OPTIONS",
        ...options
      });
    }
    upload(url2, config2 = {}) {
      config2.url = url2;
      config2.method = "UPLOAD";
      return this.middleware(config2);
    }
    download(url2, config2 = {}) {
      config2.url = url2;
      config2.method = "DOWNLOAD";
      return this.middleware(config2);
    }
  }
  class Router {
    constructor() {
      this.config = {
        type: "navigateTo",
        url: "",
        delta: 1,
        // navigateBack页面后退时,回退的层数
        params: {},
        // 传递的参数
        animationType: "pop-in",
        // 窗口动画,只在APP有效
        animationDuration: 300,
        // 窗口动画持续时间,单位毫秒,只在APP有效
        intercept: false
        // 是否需要拦截
      };
      this.route = this.route.bind(this);
    }
    // 判断url前面是否有"/"，如果没有则加上，否则无法跳转
    addRootPath(url2) {
      return url2[0] === "/" ? url2 : `/${url2}`;
    }
    // 整合路由参数
    mixinParam(url2, params) {
      url2 = url2 && this.addRootPath(url2);
      let query = "";
      if (/.*\/.*\?.*=.*/.test(url2)) {
        query = uni.$u.queryParams(params, false);
        return url2 += `&${query}`;
      }
      query = uni.$u.queryParams(params);
      return url2 += query;
    }
    // 对外的方法名称
    async route(options = {}, params = {}) {
      let mergeConfig2 = {};
      if (typeof options === "string") {
        mergeConfig2.url = this.mixinParam(options, params);
        mergeConfig2.type = "navigateTo";
      } else {
        mergeConfig2 = uni.$u.deepMerge(this.config, options);
        mergeConfig2.url = this.mixinParam(options.url, options.params);
      }
      if (mergeConfig2.url === uni.$u.page())
        return;
      if (params.intercept) {
        this.config.intercept = params.intercept;
      }
      mergeConfig2.params = params;
      mergeConfig2 = uni.$u.deepMerge(this.config, mergeConfig2);
      if (typeof uni.$u.routeIntercept === "function") {
        const isNext = await new Promise((resolve, reject) => {
          uni.$u.routeIntercept(mergeConfig2, resolve);
        });
        isNext && this.openPage(mergeConfig2);
      } else {
        this.openPage(mergeConfig2);
      }
    }
    // 执行路由跳转
    openPage(config2) {
      const {
        url: url2,
        type,
        delta,
        animationType,
        animationDuration
      } = config2;
      if (config2.type == "navigateTo" || config2.type == "to") {
        uni.navigateTo({
          url: url2,
          animationType,
          animationDuration
        });
      }
      if (config2.type == "redirectTo" || config2.type == "redirect") {
        uni.redirectTo({
          url: url2
        });
      }
      if (config2.type == "switchTab" || config2.type == "tab") {
        uni.switchTab({
          url: url2
        });
      }
      if (config2.type == "reLaunch" || config2.type == "launch") {
        uni.reLaunch({
          url: url2
        });
      }
      if (config2.type == "navigateBack" || config2.type == "back") {
        uni.navigateBack({
          delta
        });
      }
    }
  }
  const route = new Router().route;
  function colorGradient(startColor = "rgb(0, 0, 0)", endColor = "rgb(255, 255, 255)", step = 10) {
    const startRGB = hexToRgb(startColor, false);
    const startR = startRGB[0];
    const startG = startRGB[1];
    const startB = startRGB[2];
    const endRGB = hexToRgb(endColor, false);
    const endR = endRGB[0];
    const endG = endRGB[1];
    const endB = endRGB[2];
    const sR = (endR - startR) / step;
    const sG = (endG - startG) / step;
    const sB = (endB - startB) / step;
    const colorArr = [];
    for (let i2 = 0; i2 < step; i2++) {
      let hex = rgbToHex(`rgb(${Math.round(sR * i2 + startR)},${Math.round(sG * i2 + startG)},${Math.round(sB * i2 + startB)})`);
      if (i2 === 0)
        hex = rgbToHex(startColor);
      if (i2 === step - 1)
        hex = rgbToHex(endColor);
      colorArr.push(hex);
    }
    return colorArr;
  }
  function hexToRgb(sColor, str = true) {
    const reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    sColor = String(sColor).toLowerCase();
    if (sColor && reg.test(sColor)) {
      if (sColor.length === 4) {
        let sColorNew = "#";
        for (let i2 = 1; i2 < 4; i2 += 1) {
          sColorNew += sColor.slice(i2, i2 + 1).concat(sColor.slice(i2, i2 + 1));
        }
        sColor = sColorNew;
      }
      const sColorChange = [];
      for (let i2 = 1; i2 < 7; i2 += 2) {
        sColorChange.push(parseInt(`0x${sColor.slice(i2, i2 + 2)}`));
      }
      if (!str) {
        return sColorChange;
      }
      return `rgb(${sColorChange[0]},${sColorChange[1]},${sColorChange[2]})`;
    }
    if (/^(rgb|RGB)/.test(sColor)) {
      const arr = sColor.replace(/(?:\(|\)|rgb|RGB)*/g, "").split(",");
      return arr.map((val) => Number(val));
    }
    return sColor;
  }
  function rgbToHex(rgb) {
    const _this = rgb;
    const reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    if (/^(rgb|RGB)/.test(_this)) {
      const aColor = _this.replace(/(?:\(|\)|rgb|RGB)*/g, "").split(",");
      let strHex = "#";
      for (let i2 = 0; i2 < aColor.length; i2++) {
        let hex = Number(aColor[i2]).toString(16);
        hex = String(hex).length == 1 ? `${0}${hex}` : hex;
        if (hex === "0") {
          hex += hex;
        }
        strHex += hex;
      }
      if (strHex.length !== 7) {
        strHex = _this;
      }
      return strHex;
    }
    if (reg.test(_this)) {
      const aNum = _this.replace(/#/, "").split("");
      if (aNum.length === 6) {
        return _this;
      }
      if (aNum.length === 3) {
        let numHex = "#";
        for (let i2 = 0; i2 < aNum.length; i2 += 1) {
          numHex += aNum[i2] + aNum[i2];
        }
        return numHex;
      }
    } else {
      return _this;
    }
  }
  function colorToRgba(color2, alpha) {
    color2 = rgbToHex(color2);
    const reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    let sColor = String(color2).toLowerCase();
    if (sColor && reg.test(sColor)) {
      if (sColor.length === 4) {
        let sColorNew = "#";
        for (let i2 = 1; i2 < 4; i2 += 1) {
          sColorNew += sColor.slice(i2, i2 + 1).concat(sColor.slice(i2, i2 + 1));
        }
        sColor = sColorNew;
      }
      const sColorChange = [];
      for (let i2 = 1; i2 < 7; i2 += 2) {
        sColorChange.push(parseInt(`0x${sColor.slice(i2, i2 + 2)}`));
      }
      return `rgba(${sColorChange.join(",")},${alpha})`;
    }
    return sColor;
  }
  const colorGradient$1 = {
    colorGradient,
    hexToRgb,
    rgbToHex,
    colorToRgba
  };
  function email(value) {
    return /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/.test(value);
  }
  function mobile(value) {
    return /^1[23456789]\d{9}$/.test(value);
  }
  function url(value) {
    return /^((https|http|ftp|rtsp|mms):\/\/)(([0-9a-zA-Z_!~*'().&=+$%-]+: )?[0-9a-zA-Z_!~*'().&=+$%-]+@)?(([0-9]{1,3}.){3}[0-9]{1,3}|([0-9a-zA-Z_!~*'()-]+.)*([0-9a-zA-Z][0-9a-zA-Z-]{0,61})?[0-9a-zA-Z].[a-zA-Z]{2,6})(:[0-9]{1,4})?((\/?)|(\/[0-9a-zA-Z_!~*'().;?:@&=+$,%#-]+)+\/?)$/.test(value);
  }
  function date(value) {
    if (!value)
      return false;
    if (number(value))
      value = +value;
    return !/Invalid|NaN/.test(new Date(value).toString());
  }
  function dateISO(value) {
    return /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test(value);
  }
  function number(value) {
    return /^[\+-]?(\d+\.?\d*|\.\d+|\d\.\d+e\+\d+)$/.test(value);
  }
  function string(value) {
    return typeof value === "string";
  }
  function digits(value) {
    return /^\d+$/.test(value);
  }
  function idCard(value) {
    return /^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}([0-9]|X)$/.test(
      value
    );
  }
  function carNo(value) {
    const xreg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}(([0-9]{5}[DF]$)|([DF][A-HJ-NP-Z0-9][0-9]{4}$))/;
    const creg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]{1}$/;
    if (value.length === 7) {
      return creg.test(value);
    }
    if (value.length === 8) {
      return xreg.test(value);
    }
    return false;
  }
  function amount(value) {
    return /^[1-9]\d*(,\d{3})*(\.\d{1,2})?$|^0\.\d{1,2}$/.test(value);
  }
  function chinese(value) {
    const reg = /^[\u4e00-\u9fa5]+$/gi;
    return reg.test(value);
  }
  function letter(value) {
    return /^[a-zA-Z]*$/.test(value);
  }
  function enOrNum(value) {
    const reg = /^[0-9a-zA-Z]*$/g;
    return reg.test(value);
  }
  function contains(value, param) {
    return value.indexOf(param) >= 0;
  }
  function range$1(value, param) {
    return value >= param[0] && value <= param[1];
  }
  function rangeLength(value, param) {
    return value.length >= param[0] && value.length <= param[1];
  }
  function landline(value) {
    const reg = /^\d{3,4}-\d{7,8}(-\d{3,4})?$/;
    return reg.test(value);
  }
  function empty(value) {
    switch (typeof value) {
      case "undefined":
        return true;
      case "string":
        if (value.replace(/(^[ \t\n\r]*)|([ \t\n\r]*$)/g, "").length == 0)
          return true;
        break;
      case "boolean":
        if (!value)
          return true;
        break;
      case "number":
        if (value === 0 || isNaN(value))
          return true;
        break;
      case "object":
        if (value === null || value.length === 0)
          return true;
        for (const i2 in value) {
          return false;
        }
        return true;
    }
    return false;
  }
  function jsonString(value) {
    if (typeof value === "string") {
      try {
        const obj = JSON.parse(value);
        if (typeof obj === "object" && obj) {
          return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    }
    return false;
  }
  function array(value) {
    if (typeof Array.isArray === "function") {
      return Array.isArray(value);
    }
    return Object.prototype.toString.call(value) === "[object Array]";
  }
  function object(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
  }
  function code(value, len = 6) {
    return new RegExp(`^\\d{${len}}$`).test(value);
  }
  function func(value) {
    return typeof value === "function";
  }
  function promise(value) {
    return object(value) && func(value.then) && func(value.catch);
  }
  function image(value) {
    const newValue = value.split("?")[0];
    const IMAGE_REGEXP = /\.(jpeg|jpg|gif|png|svg|webp|jfif|bmp|dpg)/i;
    return IMAGE_REGEXP.test(newValue);
  }
  function video(value) {
    const VIDEO_REGEXP = /\.(mp4|mpg|mpeg|dat|asf|avi|rm|rmvb|mov|wmv|flv|mkv|m3u8)/i;
    return VIDEO_REGEXP.test(value);
  }
  function regExp(o2) {
    return o2 && Object.prototype.toString.call(o2) === "[object RegExp]";
  }
  const test = {
    email,
    mobile,
    url,
    date,
    dateISO,
    number,
    digits,
    idCard,
    carNo,
    amount,
    chinese,
    letter,
    enOrNum,
    contains,
    range: range$1,
    rangeLength,
    empty,
    isEmpty: empty,
    jsonString,
    landline,
    object,
    array,
    code,
    func,
    promise,
    video,
    image,
    regExp,
    string
  };
  let timeout = null;
  function debounce(func2, wait = 500, immediate = false) {
    if (timeout !== null)
      clearTimeout(timeout);
    if (immediate) {
      const callNow = !timeout;
      timeout = setTimeout(() => {
        timeout = null;
      }, wait);
      if (callNow)
        typeof func2 === "function" && func2();
    } else {
      timeout = setTimeout(() => {
        typeof func2 === "function" && func2();
      }, wait);
    }
  }
  let flag;
  function throttle(func2, wait = 500, immediate = true) {
    if (immediate) {
      if (!flag) {
        flag = true;
        typeof func2 === "function" && func2();
        setTimeout(() => {
          flag = false;
        }, wait);
      }
    } else if (!flag) {
      flag = true;
      setTimeout(() => {
        flag = false;
        typeof func2 === "function" && func2();
      }, wait);
    }
  }
  function strip(num, precision = 15) {
    return +parseFloat(Number(num).toPrecision(precision));
  }
  function digitLength(num) {
    const eSplit = num.toString().split(/[eE]/);
    const len = (eSplit[0].split(".")[1] || "").length - +(eSplit[1] || 0);
    return len > 0 ? len : 0;
  }
  function float2Fixed(num) {
    if (num.toString().indexOf("e") === -1) {
      return Number(num.toString().replace(".", ""));
    }
    const dLen = digitLength(num);
    return dLen > 0 ? strip(Number(num) * Math.pow(10, dLen)) : Number(num);
  }
  function checkBoundary(num) {
    {
      if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
        formatAppLog("warn", "at uni_modules/uview-plus/libs/function/digit.js:45", `${num} 超出了精度限制，结果可能不正确`);
      }
    }
  }
  function iteratorOperation(arr, operation) {
    const [num1, num2, ...others] = arr;
    let res = operation(num1, num2);
    others.forEach((num) => {
      res = operation(res, num);
    });
    return res;
  }
  function times(...nums) {
    if (nums.length > 2) {
      return iteratorOperation(nums, times);
    }
    const [num1, num2] = nums;
    const num1Changed = float2Fixed(num1);
    const num2Changed = float2Fixed(num2);
    const baseNum = digitLength(num1) + digitLength(num2);
    const leftValue = num1Changed * num2Changed;
    checkBoundary(leftValue);
    return leftValue / Math.pow(10, baseNum);
  }
  function divide(...nums) {
    if (nums.length > 2) {
      return iteratorOperation(nums, divide);
    }
    const [num1, num2] = nums;
    const num1Changed = float2Fixed(num1);
    const num2Changed = float2Fixed(num2);
    checkBoundary(num1Changed);
    checkBoundary(num2Changed);
    return times(num1Changed / num2Changed, strip(Math.pow(10, digitLength(num2) - digitLength(num1))));
  }
  function round(num, ratio) {
    const base = Math.pow(10, ratio);
    let result = divide(Math.round(Math.abs(times(num, base))), base);
    if (num < 0 && result !== 0) {
      result = times(result, -1);
    }
    return result;
  }
  function range(min = 0, max = 0, value = 0) {
    return Math.max(min, Math.min(max, Number(value)));
  }
  function getPx(value, unit = false) {
    if (test.number(value)) {
      return unit ? `${value}px` : Number(value);
    }
    if (/(rpx|upx)$/.test(value)) {
      return unit ? `${uni.upx2px(parseInt(value))}px` : Number(uni.upx2px(parseInt(value)));
    }
    return unit ? `${parseInt(value)}px` : parseInt(value);
  }
  function sleep(value = 30) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, value);
    });
  }
  function os$1() {
    return uni.getSystemInfoSync().platform.toLowerCase();
  }
  function sys() {
    return uni.getSystemInfoSync();
  }
  function random(min, max) {
    if (min >= 0 && max > 0 && max >= min) {
      const gab = max - min + 1;
      return Math.floor(Math.random() * gab + min);
    }
    return 0;
  }
  function guid(len = 32, firstU = true, radix = null) {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
    const uuid = [];
    radix = radix || chars.length;
    if (len) {
      for (let i2 = 0; i2 < len; i2++)
        uuid[i2] = chars[0 | Math.random() * radix];
    } else {
      let r2;
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = "-";
      uuid[14] = "4";
      for (let i2 = 0; i2 < 36; i2++) {
        if (!uuid[i2]) {
          r2 = 0 | Math.random() * 16;
          uuid[i2] = chars[i2 == 19 ? r2 & 3 | 8 : r2];
        }
      }
    }
    if (firstU) {
      uuid.shift();
      return `u${uuid.join("")}`;
    }
    return uuid.join("");
  }
  function $parent(name = void 0) {
    let parent = this.$parent;
    while (parent) {
      if (parent.$options && parent.$options.name !== name) {
        parent = parent.$parent;
      } else {
        return parent;
      }
    }
    return false;
  }
  function addStyle(customStyle, target = "object") {
    if (test.empty(customStyle) || typeof customStyle === "object" && target === "object" || target === "string" && typeof customStyle === "string") {
      return customStyle;
    }
    if (target === "object") {
      customStyle = trim(customStyle);
      const styleArray = customStyle.split(";");
      const style = {};
      for (let i2 = 0; i2 < styleArray.length; i2++) {
        if (styleArray[i2]) {
          const item = styleArray[i2].split(":");
          style[trim(item[0])] = trim(item[1]);
        }
      }
      return style;
    }
    let string2 = "";
    for (const i2 in customStyle) {
      const key = i2.replace(/([A-Z])/g, "-$1").toLowerCase();
      string2 += `${key}:${customStyle[i2]};`;
    }
    return trim(string2);
  }
  function addUnit(value = "auto", unit = "") {
    if (!unit) {
      unit = uni.$u.config.unit || "px";
    }
    value = String(value);
    return test.number(value) ? `${value}${unit}` : value;
  }
  function deepClone(obj) {
    if ([null, void 0, NaN, false].includes(obj))
      return obj;
    if (typeof obj !== "object" && typeof obj !== "function") {
      return obj;
    }
    const o2 = test.array(obj) ? [] : {};
    for (const i2 in obj) {
      if (obj.hasOwnProperty(i2)) {
        o2[i2] = typeof obj[i2] === "object" ? deepClone(obj[i2]) : obj[i2];
      }
    }
    return o2;
  }
  function deepMerge(target = {}, source = {}) {
    target = deepClone(target);
    if (typeof target !== "object" || typeof source !== "object")
      return false;
    for (const prop in source) {
      if (!source.hasOwnProperty(prop))
        continue;
      if (prop in target) {
        if (typeof target[prop] !== "object") {
          target[prop] = source[prop];
        } else if (typeof source[prop] !== "object") {
          target[prop] = source[prop];
        } else if (target[prop].concat && source[prop].concat) {
          target[prop] = target[prop].concat(source[prop]);
        } else {
          target[prop] = deepMerge(target[prop], source[prop]);
        }
      } else {
        target[prop] = source[prop];
      }
    }
    return target;
  }
  function error(err) {
    {
      formatAppLog("error", "at uni_modules/uview-plus/libs/function/index.js:238", `uView提示：${err}`);
    }
  }
  function randomArray(array2 = []) {
    return array2.sort(() => Math.random() - 0.5);
  }
  if (!String.prototype.padStart) {
    String.prototype.padStart = function(maxLength, fillString = " ") {
      if (Object.prototype.toString.call(fillString) !== "[object String]") {
        throw new TypeError(
          "fillString must be String"
        );
      }
      const str = this;
      if (str.length >= maxLength)
        return String(str);
      const fillLength = maxLength - str.length;
      let times2 = Math.ceil(fillLength / fillString.length);
      while (times2 >>= 1) {
        fillString += fillString;
        if (times2 === 1) {
          fillString += fillString;
        }
      }
      return fillString.slice(0, fillLength) + str;
    };
  }
  function timeFormat(dateTime = null, formatStr = "yyyy-mm-dd") {
    let date2;
    if (!dateTime) {
      date2 = /* @__PURE__ */ new Date();
    } else if (/^\d{10}$/.test(dateTime.toString().trim())) {
      date2 = new Date(dateTime * 1e3);
    } else if (typeof dateTime === "string" && /^\d+$/.test(dateTime.trim())) {
      date2 = new Date(Number(dateTime));
    } else {
      date2 = new Date(
        typeof dateTime === "string" ? dateTime.replace(/-/g, "/") : dateTime
      );
    }
    const timeSource = {
      "y": date2.getFullYear().toString(),
      // 年
      "m": (date2.getMonth() + 1).toString().padStart(2, "0"),
      // 月
      "d": date2.getDate().toString().padStart(2, "0"),
      // 日
      "h": date2.getHours().toString().padStart(2, "0"),
      // 时
      "M": date2.getMinutes().toString().padStart(2, "0"),
      // 分
      "s": date2.getSeconds().toString().padStart(2, "0")
      // 秒
      // 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (const key in timeSource) {
      const [ret] = new RegExp(`${key}+`).exec(formatStr) || [];
      if (ret) {
        const beginIndex = key === "y" && ret.length === 2 ? 2 : 0;
        formatStr = formatStr.replace(ret, timeSource[key].slice(beginIndex));
      }
    }
    return formatStr;
  }
  function timeFrom(timestamp = null, format = "yyyy-mm-dd") {
    if (timestamp == null)
      timestamp = Number(/* @__PURE__ */ new Date());
    timestamp = parseInt(timestamp);
    if (timestamp.toString().length == 10)
      timestamp *= 1e3;
    let timer = (/* @__PURE__ */ new Date()).getTime() - timestamp;
    timer = parseInt(timer / 1e3);
    let tips = "";
    switch (true) {
      case timer < 300:
        tips = "刚刚";
        break;
      case (timer >= 300 && timer < 3600):
        tips = `${parseInt(timer / 60)}分钟前`;
        break;
      case (timer >= 3600 && timer < 86400):
        tips = `${parseInt(timer / 3600)}小时前`;
        break;
      case (timer >= 86400 && timer < 2592e3):
        tips = `${parseInt(timer / 86400)}天前`;
        break;
      default:
        if (format === false) {
          if (timer >= 2592e3 && timer < 365 * 86400) {
            tips = `${parseInt(timer / (86400 * 30))}个月前`;
          } else {
            tips = `${parseInt(timer / (86400 * 365))}年前`;
          }
        } else {
          tips = timeFormat(timestamp, format);
        }
    }
    return tips;
  }
  function trim(str, pos = "both") {
    str = String(str);
    if (pos == "both") {
      return str.replace(/^\s+|\s+$/g, "");
    }
    if (pos == "left") {
      return str.replace(/^\s*/, "");
    }
    if (pos == "right") {
      return str.replace(/(\s*$)/g, "");
    }
    if (pos == "all") {
      return str.replace(/\s+/g, "");
    }
    return str;
  }
  function queryParams(data = {}, isPrefix = true, arrayFormat = "brackets") {
    const prefix = isPrefix ? "?" : "";
    const _result = [];
    if (["indices", "brackets", "repeat", "comma"].indexOf(arrayFormat) == -1)
      arrayFormat = "brackets";
    for (const key in data) {
      const value = data[key];
      if (["", void 0, null].indexOf(value) >= 0) {
        continue;
      }
      if (value.constructor === Array) {
        switch (arrayFormat) {
          case "indices":
            for (let i2 = 0; i2 < value.length; i2++) {
              _result.push(`${key}[${i2}]=${value[i2]}`);
            }
            break;
          case "brackets":
            value.forEach((_value) => {
              _result.push(`${key}[]=${_value}`);
            });
            break;
          case "repeat":
            value.forEach((_value) => {
              _result.push(`${key}=${_value}`);
            });
            break;
          case "comma":
            let commaStr = "";
            value.forEach((_value) => {
              commaStr += (commaStr ? "," : "") + _value;
            });
            _result.push(`${key}=${commaStr}`);
            break;
          default:
            value.forEach((_value) => {
              _result.push(`${key}[]=${_value}`);
            });
        }
      } else {
        _result.push(`${key}=${value}`);
      }
    }
    return _result.length ? prefix + _result.join("&") : "";
  }
  function toast(title, duration = 2e3) {
    uni.showToast({
      title: String(title),
      icon: "none",
      duration
    });
  }
  function type2icon(type = "success", fill = false) {
    if (["primary", "info", "error", "warning", "success"].indexOf(type) == -1)
      type = "success";
    let iconName = "";
    switch (type) {
      case "primary":
        iconName = "info-circle";
        break;
      case "info":
        iconName = "info-circle";
        break;
      case "error":
        iconName = "close-circle";
        break;
      case "warning":
        iconName = "error-circle";
        break;
      case "success":
        iconName = "checkmark-circle";
        break;
      default:
        iconName = "checkmark-circle";
    }
    if (fill)
      iconName += "-fill";
    return iconName;
  }
  function priceFormat(number2, decimals = 0, decimalPoint = ".", thousandsSeparator = ",") {
    number2 = `${number2}`.replace(/[^0-9+-Ee.]/g, "");
    const n2 = !isFinite(+number2) ? 0 : +number2;
    const prec = !isFinite(+decimals) ? 0 : Math.abs(decimals);
    const sep = typeof thousandsSeparator === "undefined" ? "," : thousandsSeparator;
    const dec = typeof decimalPoint === "undefined" ? "." : decimalPoint;
    let s2 = "";
    s2 = (prec ? round(n2, prec) + "" : `${Math.round(n2)}`).split(".");
    const re2 = /(-?\d+)(\d{3})/;
    while (re2.test(s2[0])) {
      s2[0] = s2[0].replace(re2, `$1${sep}$2`);
    }
    if ((s2[1] || "").length < prec) {
      s2[1] = s2[1] || "";
      s2[1] += new Array(prec - s2[1].length + 1).join("0");
    }
    return s2.join(dec);
  }
  function getDuration(value, unit = true) {
    const valueNum = parseInt(value);
    if (unit) {
      if (/s$/.test(value))
        return value;
      return value > 30 ? `${value}ms` : `${value}s`;
    }
    if (/ms$/.test(value))
      return valueNum;
    if (/s$/.test(value))
      return valueNum > 30 ? valueNum : valueNum * 1e3;
    return valueNum;
  }
  function padZero(value) {
    return `00${value}`.slice(-2);
  }
  function formValidate(instance, event) {
    const formItem = uni.$u.$parent.call(instance, "u-form-item");
    const form = uni.$u.$parent.call(instance, "u-form");
    if (formItem && form) {
      form.validateField(formItem.prop, () => {
      }, event);
    }
  }
  function getProperty(obj, key) {
    if (!obj) {
      return;
    }
    if (typeof key !== "string" || key === "") {
      return "";
    }
    if (key.indexOf(".") !== -1) {
      const keys = key.split(".");
      let firstObj = obj[keys[0]] || {};
      for (let i2 = 1; i2 < keys.length; i2++) {
        if (firstObj) {
          firstObj = firstObj[keys[i2]];
        }
      }
      return firstObj;
    }
    return obj[key];
  }
  function setProperty(obj, key, value) {
    if (!obj) {
      return;
    }
    const inFn = function(_obj, keys, v2) {
      if (keys.length === 1) {
        _obj[keys[0]] = v2;
        return;
      }
      while (keys.length > 1) {
        const k2 = keys[0];
        if (!_obj[k2] || typeof _obj[k2] !== "object") {
          _obj[k2] = {};
        }
        keys.shift();
        inFn(_obj[k2], keys, v2);
      }
    };
    if (typeof key !== "string" || key === "")
      ;
    else if (key.indexOf(".") !== -1) {
      const keys = key.split(".");
      inFn(obj, keys, value);
    } else {
      obj[key] = value;
    }
  }
  function page() {
    const pages2 = getCurrentPages();
    return `/${pages2[pages2.length - 1].route || ""}`;
  }
  function pages$1() {
    const pages2 = getCurrentPages();
    return pages2;
  }
  function setConfig({
    props: props2 = {},
    config: config2 = {},
    color: color2 = {},
    zIndex: zIndex2 = {}
  }) {
    const {
      deepMerge: deepMerge2
    } = uni.$u;
    uni.$u.config = deepMerge2(uni.$u.config, config2);
    uni.$u.props = deepMerge2(uni.$u.props, props2);
    uni.$u.color = deepMerge2(uni.$u.color, color2);
    uni.$u.zIndex = deepMerge2(uni.$u.zIndex, zIndex2);
  }
  const index = {
    range,
    getPx,
    sleep,
    os: os$1,
    sys,
    random,
    guid,
    $parent,
    addStyle,
    addUnit,
    deepClone,
    deepMerge,
    error,
    randomArray,
    timeFormat,
    timeFrom,
    trim,
    queryParams,
    toast,
    type2icon,
    priceFormat,
    getDuration,
    padZero,
    formValidate,
    getProperty,
    setProperty,
    page,
    pages: pages$1,
    setConfig
  };
  const zIndex = {
    toast: 10090,
    noNetwork: 10080,
    // popup包含popup，actionsheet，keyboard，picker的值
    popup: 10075,
    mask: 10070,
    navbar: 980,
    topTips: 975,
    sticky: 970,
    indexListSticky: 965
  };
  let platform = "none";
  platform = "vue3";
  platform = "plus";
  const platform$1 = platform;
  const $u = {
    route,
    date: index.timeFormat,
    // 另名date
    colorGradient: colorGradient$1.colorGradient,
    hexToRgb: colorGradient$1.hexToRgb,
    rgbToHex: colorGradient$1.rgbToHex,
    colorToRgba: colorGradient$1.colorToRgba,
    test,
    type: ["primary", "success", "error", "warning", "info"],
    http: new Request(),
    config,
    // uView配置信息相关，比如版本号
    zIndex,
    debounce,
    throttle,
    mixin,
    mpMixin,
    props: props$g,
    ...index,
    color,
    platform: platform$1
  };
  uni.$u = $u;
  const isObject = (val) => val !== null && typeof val === "object";
  const defaultDelimiters = ["{", "}"];
  class BaseFormatter {
    constructor() {
      this._caches = /* @__PURE__ */ Object.create(null);
    }
    interpolate(message, values, delimiters = defaultDelimiters) {
      if (!values) {
        return [message];
      }
      let tokens = this._caches[message];
      if (!tokens) {
        tokens = parse(message, delimiters);
        this._caches[message] = tokens;
      }
      return compile(tokens, values);
    }
  }
  const RE_TOKEN_LIST_VALUE = /^(?:\d)+/;
  const RE_TOKEN_NAMED_VALUE = /^(?:\w)+/;
  function parse(format, [startDelimiter, endDelimiter]) {
    const tokens = [];
    let position = 0;
    let text = "";
    while (position < format.length) {
      let char = format[position++];
      if (char === startDelimiter) {
        if (text) {
          tokens.push({ type: "text", value: text });
        }
        text = "";
        let sub = "";
        char = format[position++];
        while (char !== void 0 && char !== endDelimiter) {
          sub += char;
          char = format[position++];
        }
        const isClosed = char === endDelimiter;
        const type = RE_TOKEN_LIST_VALUE.test(sub) ? "list" : isClosed && RE_TOKEN_NAMED_VALUE.test(sub) ? "named" : "unknown";
        tokens.push({ value: sub, type });
      } else {
        text += char;
      }
    }
    text && tokens.push({ type: "text", value: text });
    return tokens;
  }
  function compile(tokens, values) {
    const compiled = [];
    let index2 = 0;
    const mode = Array.isArray(values) ? "list" : isObject(values) ? "named" : "unknown";
    if (mode === "unknown") {
      return compiled;
    }
    while (index2 < tokens.length) {
      const token = tokens[index2];
      switch (token.type) {
        case "text":
          compiled.push(token.value);
          break;
        case "list":
          compiled.push(values[parseInt(token.value, 10)]);
          break;
        case "named":
          if (mode === "named") {
            compiled.push(values[token.value]);
          } else {
            {
              console.warn(`Type of token '${token.type}' and format of value '${mode}' don't match!`);
            }
          }
          break;
        case "unknown":
          {
            console.warn(`Detect 'unknown' type of token!`);
          }
          break;
      }
      index2++;
    }
    return compiled;
  }
  const LOCALE_ZH_HANS = "zh-Hans";
  const LOCALE_ZH_HANT = "zh-Hant";
  const LOCALE_EN = "en";
  const LOCALE_FR = "fr";
  const LOCALE_ES = "es";
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  const hasOwn = (val, key) => hasOwnProperty.call(val, key);
  const defaultFormatter = new BaseFormatter();
  function include(str, parts) {
    return !!parts.find((part) => str.indexOf(part) !== -1);
  }
  function startsWith(str, parts) {
    return parts.find((part) => str.indexOf(part) === 0);
  }
  function normalizeLocale(locale, messages) {
    if (!locale) {
      return;
    }
    locale = locale.trim().replace(/_/g, "-");
    if (messages && messages[locale]) {
      return locale;
    }
    locale = locale.toLowerCase();
    if (locale === "chinese") {
      return LOCALE_ZH_HANS;
    }
    if (locale.indexOf("zh") === 0) {
      if (locale.indexOf("-hans") > -1) {
        return LOCALE_ZH_HANS;
      }
      if (locale.indexOf("-hant") > -1) {
        return LOCALE_ZH_HANT;
      }
      if (include(locale, ["-tw", "-hk", "-mo", "-cht"])) {
        return LOCALE_ZH_HANT;
      }
      return LOCALE_ZH_HANS;
    }
    let locales = [LOCALE_EN, LOCALE_FR, LOCALE_ES];
    if (messages && Object.keys(messages).length > 0) {
      locales = Object.keys(messages);
    }
    const lang = startsWith(locale, locales);
    if (lang) {
      return lang;
    }
  }
  class I18n {
    constructor({ locale, fallbackLocale, messages, watcher, formater }) {
      this.locale = LOCALE_EN;
      this.fallbackLocale = LOCALE_EN;
      this.message = {};
      this.messages = {};
      this.watchers = [];
      if (fallbackLocale) {
        this.fallbackLocale = fallbackLocale;
      }
      this.formater = formater || defaultFormatter;
      this.messages = messages || {};
      this.setLocale(locale || LOCALE_EN);
      if (watcher) {
        this.watchLocale(watcher);
      }
    }
    setLocale(locale) {
      const oldLocale = this.locale;
      this.locale = normalizeLocale(locale, this.messages) || this.fallbackLocale;
      if (!this.messages[this.locale]) {
        this.messages[this.locale] = {};
      }
      this.message = this.messages[this.locale];
      if (oldLocale !== this.locale) {
        this.watchers.forEach((watcher) => {
          watcher(this.locale, oldLocale);
        });
      }
    }
    getLocale() {
      return this.locale;
    }
    watchLocale(fn) {
      const index2 = this.watchers.push(fn) - 1;
      return () => {
        this.watchers.splice(index2, 1);
      };
    }
    add(locale, message, override = true) {
      const curMessages = this.messages[locale];
      if (curMessages) {
        if (override) {
          Object.assign(curMessages, message);
        } else {
          Object.keys(message).forEach((key) => {
            if (!hasOwn(curMessages, key)) {
              curMessages[key] = message[key];
            }
          });
        }
      } else {
        this.messages[locale] = message;
      }
    }
    f(message, values, delimiters) {
      return this.formater.interpolate(message, values, delimiters).join("");
    }
    t(key, locale, values) {
      let message = this.message;
      if (typeof locale === "string") {
        locale = normalizeLocale(locale, this.messages);
        locale && (message = this.messages[locale]);
      } else {
        values = locale;
      }
      if (!hasOwn(message, key)) {
        console.warn(`Cannot translate the value of keypath ${key}. Use the value of keypath as default.`);
        return key;
      }
      return this.formater.interpolate(message[key], values).join("");
    }
  }
  function watchAppLocale(appVm, i18n) {
    if (appVm.$watchLocale) {
      appVm.$watchLocale((newLocale) => {
        i18n.setLocale(newLocale);
      });
    } else {
      appVm.$watch(() => appVm.$locale, (newLocale) => {
        i18n.setLocale(newLocale);
      });
    }
  }
  function getDefaultLocale() {
    if (typeof uni !== "undefined" && uni.getLocale) {
      return uni.getLocale();
    }
    if (typeof global !== "undefined" && global.getLocale) {
      return global.getLocale();
    }
    return LOCALE_EN;
  }
  function initVueI18n(locale, messages = {}, fallbackLocale, watcher) {
    if (typeof locale !== "string") {
      [locale, messages] = [
        messages,
        locale
      ];
    }
    if (typeof locale !== "string") {
      locale = getDefaultLocale();
    }
    if (typeof fallbackLocale !== "string") {
      fallbackLocale = typeof __uniConfig !== "undefined" && __uniConfig.fallbackLocale || LOCALE_EN;
    }
    const i18n = new I18n({
      locale,
      fallbackLocale,
      messages,
      watcher
    });
    let t2 = (key, values) => {
      if (typeof getApp !== "function") {
        t2 = function(key2, values2) {
          return i18n.t(key2, values2);
        };
      } else {
        let isWatchedAppLocale = false;
        t2 = function(key2, values2) {
          const appVm = getApp().$vm;
          if (appVm) {
            appVm.$locale;
            if (!isWatchedAppLocale) {
              isWatchedAppLocale = true;
              watchAppLocale(appVm, i18n);
            }
          }
          return i18n.t(key2, values2);
        };
      }
      return t2(key, values);
    };
    return {
      i18n,
      f(message, values, delimiters) {
        return i18n.f(message, values, delimiters);
      },
      t(key, values) {
        return t2(key, values);
      },
      add(locale2, message, override = true) {
        return i18n.add(locale2, message, override);
      },
      watch(fn) {
        return i18n.watchLocale(fn);
      },
      getLocale() {
        return i18n.getLocale();
      },
      setLocale(newLocale) {
        return i18n.setLocale(newLocale);
      }
    };
  }
  const pages = [
    {
      path: "pages/Login/Login",
      style: {
        navigationBarTitleText: "登录",
        enablePullDownRefresh: false
      }
    },
    {
      path: "pages/index/index",
      style: {
        navigationBarTitleText: "UrShop商城"
      }
    },
    {
      path: "pages/category/category",
      style: {
        enablePullDownRefresh: false
      }
    },
    {
      path: "pages/cart/cart",
      style: {
        enablePullDownRefresh: false,
        navigationBarTitleText: "购物车"
      }
    },
    {
      path: "pages/mine/mine",
      style: {
        enablePullDownRefresh: false,
        navigationBarTitleText: "个人中心"
      }
    },
    {
      path: "pages/options/options",
      style: {
        navigationBarTitleText: "选择小区"
      }
    },
    {
      path: "pages/subcategory/subcategory",
      style: {
        navigationBarTitleText: "",
        enablePullDownRefresh: false
      }
    },
    {
      path: "pages/detail/detail",
      style: {
        navigationBarTitleText: "商品详情",
        enablePullDownRefresh: false
      }
    },
    {
      path: "pages/order/order",
      style: {
        navigationBarTitleText: "全部订单",
        enablePullDownRefresh: false
      }
    },
    {
      path: "pages/orderList/orderList",
      style: {
        navigationBarTitleText: "售后申请",
        enablePullDownRefresh: false
      }
    },
    {
      path: "pages/address/address",
      style: {
        navigationBarTitleText: "地址管理",
        enablePullDownRefresh: false
      }
    },
    {
      path: "pages/question/question",
      style: {
        navigationBarTitleText: "关于我们",
        enablePullDownRefresh: false
      }
    },
    {
      path: "pages/address-editor/address-editor",
      style: {
        navigationBarTitleText: "添加地址",
        enablePullDownRefresh: false
      }
    },
    {
      path: "pages/search/search",
      style: {
        navigationBarTitleText: "搜索",
        enablePullDownRefresh: false
      }
    }
  ];
  const globalStyle = {
    navigationBarTextStyle: "white",
    navigationBarTitleText: "UrShop商城",
    navigationBarBackgroundColor: "#950000",
    backgroundColor: "#F8F8F8"
  };
  const uniIdRouter = {};
  const tabBar = {
    list: [
      {
        pagePath: "pages/index/index",
        selectedIconPath: "./static/images/home.png",
        iconPath: "./static/images/home_.png"
      },
      {
        pagePath: "pages/category/category",
        selectedIconPath: "./static/images/category.png",
        iconPath: "./static/images/category_.png"
      },
      {
        pagePath: "pages/cart/cart",
        selectedIconPath: "./static/images/cart.png",
        iconPath: "./static/images/cart_.png"
      },
      {
        pagePath: "pages/mine/mine",
        selectedIconPath: "./static/images/my.png",
        iconPath: "./static/images/my_.png"
      }
    ]
  };
  const t = {
    pages,
    globalStyle,
    uniIdRouter,
    tabBar
  };
  function n(e) {
    return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
  }
  function s(e, t2, n2) {
    return e(n2 = { path: t2, exports: {}, require: function(e2, t3) {
      return function() {
        throw new Error("Dynamic requires are not currently supported by @rollup/plugin-commonjs");
      }(null == t3 && n2.path);
    } }, n2.exports), n2.exports;
  }
  var r = s(function(e, t2) {
    var n2;
    e.exports = (n2 = n2 || function(e2, t3) {
      var n3 = Object.create || function() {
        function e3() {
        }
        return function(t4) {
          var n4;
          return e3.prototype = t4, n4 = new e3(), e3.prototype = null, n4;
        };
      }(), s2 = {}, r2 = s2.lib = {}, i2 = r2.Base = { extend: function(e3) {
        var t4 = n3(this);
        return e3 && t4.mixIn(e3), t4.hasOwnProperty("init") && this.init !== t4.init || (t4.init = function() {
          t4.$super.init.apply(this, arguments);
        }), t4.init.prototype = t4, t4.$super = this, t4;
      }, create: function() {
        var e3 = this.extend();
        return e3.init.apply(e3, arguments), e3;
      }, init: function() {
      }, mixIn: function(e3) {
        for (var t4 in e3)
          e3.hasOwnProperty(t4) && (this[t4] = e3[t4]);
        e3.hasOwnProperty("toString") && (this.toString = e3.toString);
      }, clone: function() {
        return this.init.prototype.extend(this);
      } }, o2 = r2.WordArray = i2.extend({ init: function(e3, n4) {
        e3 = this.words = e3 || [], this.sigBytes = n4 != t3 ? n4 : 4 * e3.length;
      }, toString: function(e3) {
        return (e3 || c2).stringify(this);
      }, concat: function(e3) {
        var t4 = this.words, n4 = e3.words, s3 = this.sigBytes, r3 = e3.sigBytes;
        if (this.clamp(), s3 % 4)
          for (var i3 = 0; i3 < r3; i3++) {
            var o3 = n4[i3 >>> 2] >>> 24 - i3 % 4 * 8 & 255;
            t4[s3 + i3 >>> 2] |= o3 << 24 - (s3 + i3) % 4 * 8;
          }
        else
          for (i3 = 0; i3 < r3; i3 += 4)
            t4[s3 + i3 >>> 2] = n4[i3 >>> 2];
        return this.sigBytes += r3, this;
      }, clamp: function() {
        var t4 = this.words, n4 = this.sigBytes;
        t4[n4 >>> 2] &= 4294967295 << 32 - n4 % 4 * 8, t4.length = e2.ceil(n4 / 4);
      }, clone: function() {
        var e3 = i2.clone.call(this);
        return e3.words = this.words.slice(0), e3;
      }, random: function(t4) {
        for (var n4, s3 = [], r3 = function(t5) {
          t5 = t5;
          var n5 = 987654321, s4 = 4294967295;
          return function() {
            var r4 = ((n5 = 36969 * (65535 & n5) + (n5 >> 16) & s4) << 16) + (t5 = 18e3 * (65535 & t5) + (t5 >> 16) & s4) & s4;
            return r4 /= 4294967296, (r4 += 0.5) * (e2.random() > 0.5 ? 1 : -1);
          };
        }, i3 = 0; i3 < t4; i3 += 4) {
          var a3 = r3(4294967296 * (n4 || e2.random()));
          n4 = 987654071 * a3(), s3.push(4294967296 * a3() | 0);
        }
        return new o2.init(s3, t4);
      } }), a2 = s2.enc = {}, c2 = a2.Hex = { stringify: function(e3) {
        for (var t4 = e3.words, n4 = e3.sigBytes, s3 = [], r3 = 0; r3 < n4; r3++) {
          var i3 = t4[r3 >>> 2] >>> 24 - r3 % 4 * 8 & 255;
          s3.push((i3 >>> 4).toString(16)), s3.push((15 & i3).toString(16));
        }
        return s3.join("");
      }, parse: function(e3) {
        for (var t4 = e3.length, n4 = [], s3 = 0; s3 < t4; s3 += 2)
          n4[s3 >>> 3] |= parseInt(e3.substr(s3, 2), 16) << 24 - s3 % 8 * 4;
        return new o2.init(n4, t4 / 2);
      } }, u2 = a2.Latin1 = { stringify: function(e3) {
        for (var t4 = e3.words, n4 = e3.sigBytes, s3 = [], r3 = 0; r3 < n4; r3++) {
          var i3 = t4[r3 >>> 2] >>> 24 - r3 % 4 * 8 & 255;
          s3.push(String.fromCharCode(i3));
        }
        return s3.join("");
      }, parse: function(e3) {
        for (var t4 = e3.length, n4 = [], s3 = 0; s3 < t4; s3++)
          n4[s3 >>> 2] |= (255 & e3.charCodeAt(s3)) << 24 - s3 % 4 * 8;
        return new o2.init(n4, t4);
      } }, h2 = a2.Utf8 = { stringify: function(e3) {
        try {
          return decodeURIComponent(escape(u2.stringify(e3)));
        } catch (e4) {
          throw new Error("Malformed UTF-8 data");
        }
      }, parse: function(e3) {
        return u2.parse(unescape(encodeURIComponent(e3)));
      } }, l2 = r2.BufferedBlockAlgorithm = i2.extend({ reset: function() {
        this._data = new o2.init(), this._nDataBytes = 0;
      }, _append: function(e3) {
        "string" == typeof e3 && (e3 = h2.parse(e3)), this._data.concat(e3), this._nDataBytes += e3.sigBytes;
      }, _process: function(t4) {
        var n4 = this._data, s3 = n4.words, r3 = n4.sigBytes, i3 = this.blockSize, a3 = r3 / (4 * i3), c3 = (a3 = t4 ? e2.ceil(a3) : e2.max((0 | a3) - this._minBufferSize, 0)) * i3, u3 = e2.min(4 * c3, r3);
        if (c3) {
          for (var h3 = 0; h3 < c3; h3 += i3)
            this._doProcessBlock(s3, h3);
          var l3 = s3.splice(0, c3);
          n4.sigBytes -= u3;
        }
        return new o2.init(l3, u3);
      }, clone: function() {
        var e3 = i2.clone.call(this);
        return e3._data = this._data.clone(), e3;
      }, _minBufferSize: 0 });
      r2.Hasher = l2.extend({ cfg: i2.extend(), init: function(e3) {
        this.cfg = this.cfg.extend(e3), this.reset();
      }, reset: function() {
        l2.reset.call(this), this._doReset();
      }, update: function(e3) {
        return this._append(e3), this._process(), this;
      }, finalize: function(e3) {
        return e3 && this._append(e3), this._doFinalize();
      }, blockSize: 16, _createHelper: function(e3) {
        return function(t4, n4) {
          return new e3.init(n4).finalize(t4);
        };
      }, _createHmacHelper: function(e3) {
        return function(t4, n4) {
          return new d2.HMAC.init(e3, n4).finalize(t4);
        };
      } });
      var d2 = s2.algo = {};
      return s2;
    }(Math), n2);
  }), i = r, o = (s(function(e, t2) {
    var n2;
    e.exports = (n2 = i, function(e2) {
      var t3 = n2, s2 = t3.lib, r2 = s2.WordArray, i2 = s2.Hasher, o2 = t3.algo, a2 = [];
      !function() {
        for (var t4 = 0; t4 < 64; t4++)
          a2[t4] = 4294967296 * e2.abs(e2.sin(t4 + 1)) | 0;
      }();
      var c2 = o2.MD5 = i2.extend({ _doReset: function() {
        this._hash = new r2.init([1732584193, 4023233417, 2562383102, 271733878]);
      }, _doProcessBlock: function(e3, t4) {
        for (var n3 = 0; n3 < 16; n3++) {
          var s3 = t4 + n3, r3 = e3[s3];
          e3[s3] = 16711935 & (r3 << 8 | r3 >>> 24) | 4278255360 & (r3 << 24 | r3 >>> 8);
        }
        var i3 = this._hash.words, o3 = e3[t4 + 0], c3 = e3[t4 + 1], p2 = e3[t4 + 2], f2 = e3[t4 + 3], g2 = e3[t4 + 4], m2 = e3[t4 + 5], y2 = e3[t4 + 6], _2 = e3[t4 + 7], w2 = e3[t4 + 8], v2 = e3[t4 + 9], I2 = e3[t4 + 10], S2 = e3[t4 + 11], b2 = e3[t4 + 12], k2 = e3[t4 + 13], C = e3[t4 + 14], T2 = e3[t4 + 15], P2 = i3[0], A2 = i3[1], E2 = i3[2], O = i3[3];
        P2 = u2(P2, A2, E2, O, o3, 7, a2[0]), O = u2(O, P2, A2, E2, c3, 12, a2[1]), E2 = u2(E2, O, P2, A2, p2, 17, a2[2]), A2 = u2(A2, E2, O, P2, f2, 22, a2[3]), P2 = u2(P2, A2, E2, O, g2, 7, a2[4]), O = u2(O, P2, A2, E2, m2, 12, a2[5]), E2 = u2(E2, O, P2, A2, y2, 17, a2[6]), A2 = u2(A2, E2, O, P2, _2, 22, a2[7]), P2 = u2(P2, A2, E2, O, w2, 7, a2[8]), O = u2(O, P2, A2, E2, v2, 12, a2[9]), E2 = u2(E2, O, P2, A2, I2, 17, a2[10]), A2 = u2(A2, E2, O, P2, S2, 22, a2[11]), P2 = u2(P2, A2, E2, O, b2, 7, a2[12]), O = u2(O, P2, A2, E2, k2, 12, a2[13]), E2 = u2(E2, O, P2, A2, C, 17, a2[14]), P2 = h2(P2, A2 = u2(A2, E2, O, P2, T2, 22, a2[15]), E2, O, c3, 5, a2[16]), O = h2(O, P2, A2, E2, y2, 9, a2[17]), E2 = h2(E2, O, P2, A2, S2, 14, a2[18]), A2 = h2(A2, E2, O, P2, o3, 20, a2[19]), P2 = h2(P2, A2, E2, O, m2, 5, a2[20]), O = h2(O, P2, A2, E2, I2, 9, a2[21]), E2 = h2(E2, O, P2, A2, T2, 14, a2[22]), A2 = h2(A2, E2, O, P2, g2, 20, a2[23]), P2 = h2(P2, A2, E2, O, v2, 5, a2[24]), O = h2(O, P2, A2, E2, C, 9, a2[25]), E2 = h2(E2, O, P2, A2, f2, 14, a2[26]), A2 = h2(A2, E2, O, P2, w2, 20, a2[27]), P2 = h2(P2, A2, E2, O, k2, 5, a2[28]), O = h2(O, P2, A2, E2, p2, 9, a2[29]), E2 = h2(E2, O, P2, A2, _2, 14, a2[30]), P2 = l2(P2, A2 = h2(A2, E2, O, P2, b2, 20, a2[31]), E2, O, m2, 4, a2[32]), O = l2(O, P2, A2, E2, w2, 11, a2[33]), E2 = l2(E2, O, P2, A2, S2, 16, a2[34]), A2 = l2(A2, E2, O, P2, C, 23, a2[35]), P2 = l2(P2, A2, E2, O, c3, 4, a2[36]), O = l2(O, P2, A2, E2, g2, 11, a2[37]), E2 = l2(E2, O, P2, A2, _2, 16, a2[38]), A2 = l2(A2, E2, O, P2, I2, 23, a2[39]), P2 = l2(P2, A2, E2, O, k2, 4, a2[40]), O = l2(O, P2, A2, E2, o3, 11, a2[41]), E2 = l2(E2, O, P2, A2, f2, 16, a2[42]), A2 = l2(A2, E2, O, P2, y2, 23, a2[43]), P2 = l2(P2, A2, E2, O, v2, 4, a2[44]), O = l2(O, P2, A2, E2, b2, 11, a2[45]), E2 = l2(E2, O, P2, A2, T2, 16, a2[46]), P2 = d2(P2, A2 = l2(A2, E2, O, P2, p2, 23, a2[47]), E2, O, o3, 6, a2[48]), O = d2(O, P2, A2, E2, _2, 10, a2[49]), E2 = d2(E2, O, P2, A2, C, 15, a2[50]), A2 = d2(A2, E2, O, P2, m2, 21, a2[51]), P2 = d2(P2, A2, E2, O, b2, 6, a2[52]), O = d2(O, P2, A2, E2, f2, 10, a2[53]), E2 = d2(E2, O, P2, A2, I2, 15, a2[54]), A2 = d2(A2, E2, O, P2, c3, 21, a2[55]), P2 = d2(P2, A2, E2, O, w2, 6, a2[56]), O = d2(O, P2, A2, E2, T2, 10, a2[57]), E2 = d2(E2, O, P2, A2, y2, 15, a2[58]), A2 = d2(A2, E2, O, P2, k2, 21, a2[59]), P2 = d2(P2, A2, E2, O, g2, 6, a2[60]), O = d2(O, P2, A2, E2, S2, 10, a2[61]), E2 = d2(E2, O, P2, A2, p2, 15, a2[62]), A2 = d2(A2, E2, O, P2, v2, 21, a2[63]), i3[0] = i3[0] + P2 | 0, i3[1] = i3[1] + A2 | 0, i3[2] = i3[2] + E2 | 0, i3[3] = i3[3] + O | 0;
      }, _doFinalize: function() {
        var t4 = this._data, n3 = t4.words, s3 = 8 * this._nDataBytes, r3 = 8 * t4.sigBytes;
        n3[r3 >>> 5] |= 128 << 24 - r3 % 32;
        var i3 = e2.floor(s3 / 4294967296), o3 = s3;
        n3[15 + (r3 + 64 >>> 9 << 4)] = 16711935 & (i3 << 8 | i3 >>> 24) | 4278255360 & (i3 << 24 | i3 >>> 8), n3[14 + (r3 + 64 >>> 9 << 4)] = 16711935 & (o3 << 8 | o3 >>> 24) | 4278255360 & (o3 << 24 | o3 >>> 8), t4.sigBytes = 4 * (n3.length + 1), this._process();
        for (var a3 = this._hash, c3 = a3.words, u3 = 0; u3 < 4; u3++) {
          var h3 = c3[u3];
          c3[u3] = 16711935 & (h3 << 8 | h3 >>> 24) | 4278255360 & (h3 << 24 | h3 >>> 8);
        }
        return a3;
      }, clone: function() {
        var e3 = i2.clone.call(this);
        return e3._hash = this._hash.clone(), e3;
      } });
      function u2(e3, t4, n3, s3, r3, i3, o3) {
        var a3 = e3 + (t4 & n3 | ~t4 & s3) + r3 + o3;
        return (a3 << i3 | a3 >>> 32 - i3) + t4;
      }
      function h2(e3, t4, n3, s3, r3, i3, o3) {
        var a3 = e3 + (t4 & s3 | n3 & ~s3) + r3 + o3;
        return (a3 << i3 | a3 >>> 32 - i3) + t4;
      }
      function l2(e3, t4, n3, s3, r3, i3, o3) {
        var a3 = e3 + (t4 ^ n3 ^ s3) + r3 + o3;
        return (a3 << i3 | a3 >>> 32 - i3) + t4;
      }
      function d2(e3, t4, n3, s3, r3, i3, o3) {
        var a3 = e3 + (n3 ^ (t4 | ~s3)) + r3 + o3;
        return (a3 << i3 | a3 >>> 32 - i3) + t4;
      }
      t3.MD5 = i2._createHelper(c2), t3.HmacMD5 = i2._createHmacHelper(c2);
    }(Math), n2.MD5);
  }), s(function(e, t2) {
    var n2;
    e.exports = (n2 = i, void function() {
      var e2 = n2, t3 = e2.lib.Base, s2 = e2.enc.Utf8;
      e2.algo.HMAC = t3.extend({ init: function(e3, t4) {
        e3 = this._hasher = new e3.init(), "string" == typeof t4 && (t4 = s2.parse(t4));
        var n3 = e3.blockSize, r2 = 4 * n3;
        t4.sigBytes > r2 && (t4 = e3.finalize(t4)), t4.clamp();
        for (var i2 = this._oKey = t4.clone(), o2 = this._iKey = t4.clone(), a2 = i2.words, c2 = o2.words, u2 = 0; u2 < n3; u2++)
          a2[u2] ^= 1549556828, c2[u2] ^= 909522486;
        i2.sigBytes = o2.sigBytes = r2, this.reset();
      }, reset: function() {
        var e3 = this._hasher;
        e3.reset(), e3.update(this._iKey);
      }, update: function(e3) {
        return this._hasher.update(e3), this;
      }, finalize: function(e3) {
        var t4 = this._hasher, n3 = t4.finalize(e3);
        return t4.reset(), t4.finalize(this._oKey.clone().concat(n3));
      } });
    }());
  }), s(function(e, t2) {
    e.exports = i.HmacMD5;
  })), a = s(function(e, t2) {
    e.exports = i.enc.Utf8;
  }), c = s(function(e, t2) {
    var n2;
    e.exports = (n2 = i, function() {
      var e2 = n2, t3 = e2.lib.WordArray;
      function s2(e3, n3, s3) {
        for (var r2 = [], i2 = 0, o2 = 0; o2 < n3; o2++)
          if (o2 % 4) {
            var a2 = s3[e3.charCodeAt(o2 - 1)] << o2 % 4 * 2, c2 = s3[e3.charCodeAt(o2)] >>> 6 - o2 % 4 * 2;
            r2[i2 >>> 2] |= (a2 | c2) << 24 - i2 % 4 * 8, i2++;
          }
        return t3.create(r2, i2);
      }
      e2.enc.Base64 = { stringify: function(e3) {
        var t4 = e3.words, n3 = e3.sigBytes, s3 = this._map;
        e3.clamp();
        for (var r2 = [], i2 = 0; i2 < n3; i2 += 3)
          for (var o2 = (t4[i2 >>> 2] >>> 24 - i2 % 4 * 8 & 255) << 16 | (t4[i2 + 1 >>> 2] >>> 24 - (i2 + 1) % 4 * 8 & 255) << 8 | t4[i2 + 2 >>> 2] >>> 24 - (i2 + 2) % 4 * 8 & 255, a2 = 0; a2 < 4 && i2 + 0.75 * a2 < n3; a2++)
            r2.push(s3.charAt(o2 >>> 6 * (3 - a2) & 63));
        var c2 = s3.charAt(64);
        if (c2)
          for (; r2.length % 4; )
            r2.push(c2);
        return r2.join("");
      }, parse: function(e3) {
        var t4 = e3.length, n3 = this._map, r2 = this._reverseMap;
        if (!r2) {
          r2 = this._reverseMap = [];
          for (var i2 = 0; i2 < n3.length; i2++)
            r2[n3.charCodeAt(i2)] = i2;
        }
        var o2 = n3.charAt(64);
        if (o2) {
          var a2 = e3.indexOf(o2);
          -1 !== a2 && (t4 = a2);
        }
        return s2(e3, t4, r2);
      }, _map: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=" };
    }(), n2.enc.Base64);
  });
  const u = "FUNCTION", h = "OBJECT", l = "CLIENT_DB", d = "pending", p = "fullfilled", f = "rejected";
  function g(e) {
    return Object.prototype.toString.call(e).slice(8, -1).toLowerCase();
  }
  function m(e) {
    return "object" === g(e);
  }
  function y(e) {
    return "function" == typeof e;
  }
  function _(e) {
    return function() {
      try {
        return e.apply(e, arguments);
      } catch (e2) {
        console.error(e2);
      }
    };
  }
  const w = "REJECTED", v = "NOT_PENDING";
  class I {
    constructor({ createPromise: e, retryRule: t2 = w } = {}) {
      this.createPromise = e, this.status = null, this.promise = null, this.retryRule = t2;
    }
    get needRetry() {
      if (!this.status)
        return true;
      switch (this.retryRule) {
        case w:
          return this.status === f;
        case v:
          return this.status !== d;
      }
    }
    exec() {
      return this.needRetry ? (this.status = d, this.promise = this.createPromise().then((e) => (this.status = p, Promise.resolve(e)), (e) => (this.status = f, Promise.reject(e))), this.promise) : this.promise;
    }
  }
  function S(e) {
    return e && "string" == typeof e ? JSON.parse(e) : e;
  }
  const b = true, k = "app", T = S([]), P = k, A = S('{\n    "address": [\n        "127.0.0.1",\n        "192.168.1.236"\n    ],\n    "debugPort": 9000,\n    "initialLaunchType": "local",\n    "servePort": 7000,\n    "skipFiles": [\n        "<node_internals>/**",\n        "C:/Users/Administrator/Downloads/HBuilderX.3.8.4.20230531/HBuilderX/plugins/unicloud/**/*.js"\n    ]\n}\n'), E = S('[{"provider":"aliyun","spaceName":"study-test1","spaceId":"mp-00190d39-ad48-4c50-922a-263d61630366","clientSecret":"6V43gH/6HS9/ndJ2vxzqzg==","endpoint":"https://api.next.bspapp.com"}]') || [];
  let x = "";
  try {
    x = "__UNI__A016241";
  } catch (e) {
  }
  let R = {};
  function U(e, t2 = {}) {
    var n2, s2;
    return n2 = R, s2 = e, Object.prototype.hasOwnProperty.call(n2, s2) || (R[e] = t2), R[e];
  }
  R = uni._globalUniCloudObj ? uni._globalUniCloudObj : uni._globalUniCloudObj = {};
  const L = ["invoke", "success", "fail", "complete"], N = U("_globalUniCloudInterceptor");
  function D(e, t2) {
    N[e] || (N[e] = {}), m(t2) && Object.keys(t2).forEach((n2) => {
      L.indexOf(n2) > -1 && function(e2, t3, n3) {
        let s2 = N[e2][t3];
        s2 || (s2 = N[e2][t3] = []), -1 === s2.indexOf(n3) && y(n3) && s2.push(n3);
      }(e, n2, t2[n2]);
    });
  }
  function F(e, t2) {
    N[e] || (N[e] = {}), m(t2) ? Object.keys(t2).forEach((n2) => {
      L.indexOf(n2) > -1 && function(e2, t3, n3) {
        const s2 = N[e2][t3];
        if (!s2)
          return;
        const r2 = s2.indexOf(n3);
        r2 > -1 && s2.splice(r2, 1);
      }(e, n2, t2[n2]);
    }) : delete N[e];
  }
  function q(e, t2) {
    return e && 0 !== e.length ? e.reduce((e2, n2) => e2.then(() => n2(t2)), Promise.resolve()) : Promise.resolve();
  }
  function M(e, t2) {
    return N[e] && N[e][t2] || [];
  }
  function K(e) {
    D("callObject", e);
  }
  const j = U("_globalUniCloudListener"), B = "response", $ = "needLogin", W = "refreshToken", z = "clientdb", J = "cloudfunction", H = "cloudobject";
  function G(e) {
    return j[e] || (j[e] = []), j[e];
  }
  function V(e, t2) {
    const n2 = G(e);
    n2.includes(t2) || n2.push(t2);
  }
  function Q(e, t2) {
    const n2 = G(e), s2 = n2.indexOf(t2);
    -1 !== s2 && n2.splice(s2, 1);
  }
  function Y(e, t2) {
    const n2 = G(e);
    for (let e2 = 0; e2 < n2.length; e2++) {
      (0, n2[e2])(t2);
    }
  }
  let X, Z = false;
  function ee() {
    return X || (X = new Promise((e) => {
      Z && e(), function t2() {
        if ("function" == typeof getCurrentPages) {
          const t3 = getCurrentPages();
          t3 && t3[0] && (Z = true, e());
        }
        Z || setTimeout(() => {
          t2();
        }, 30);
      }();
    }), X);
  }
  function te(e) {
    const t2 = {};
    for (const n2 in e) {
      const s2 = e[n2];
      y(s2) && (t2[n2] = _(s2));
    }
    return t2;
  }
  class ne extends Error {
    constructor(e) {
      super(e.message), this.errMsg = e.message || e.errMsg || "unknown system error", this.code = this.errCode = e.code || e.errCode || "SYSTEM_ERROR", this.errSubject = this.subject = e.subject || e.errSubject, this.cause = e.cause, this.requestId = e.requestId;
    }
    toJson(e = 0) {
      if (!(e >= 10))
        return e++, { errCode: this.errCode, errMsg: this.errMsg, errSubject: this.errSubject, cause: this.cause && this.cause.toJson ? this.cause.toJson(e) : this.cause };
    }
  }
  var se = { request: (e) => uni.request(e), uploadFile: (e) => uni.uploadFile(e), setStorageSync: (e, t2) => uni.setStorageSync(e, t2), getStorageSync: (e) => uni.getStorageSync(e), removeStorageSync: (e) => uni.removeStorageSync(e), clearStorageSync: () => uni.clearStorageSync() };
  function re(e) {
    return e && re(e.__v_raw) || e;
  }
  function ie() {
    return { token: se.getStorageSync("uni_id_token") || se.getStorageSync("uniIdToken"), tokenExpired: se.getStorageSync("uni_id_token_expired") };
  }
  function oe({ token: e, tokenExpired: t2 } = {}) {
    e && se.setStorageSync("uni_id_token", e), t2 && se.setStorageSync("uni_id_token_expired", t2);
  }
  let ae, ce;
  function ue() {
    return ae || (ae = uni.getSystemInfoSync()), ae;
  }
  function he() {
    let e, t2;
    try {
      if (uni.getLaunchOptionsSync) {
        if (uni.getLaunchOptionsSync.toString().indexOf("not yet implemented") > -1)
          return;
        const { scene: n2, channel: s2 } = uni.getLaunchOptionsSync();
        e = s2, t2 = n2;
      }
    } catch (e2) {
    }
    return { channel: e, scene: t2 };
  }
  function le() {
    const e = uni.getLocale && uni.getLocale() || "en";
    if (ce)
      return { ...ce, locale: e, LOCALE: e };
    const t2 = ue(), { deviceId: n2, osName: s2, uniPlatform: r2, appId: i2 } = t2, o2 = ["pixelRatio", "brand", "model", "system", "language", "version", "platform", "host", "SDKVersion", "swanNativeVersion", "app", "AppPlatform", "fontSizeSetting"];
    for (let e2 = 0; e2 < o2.length; e2++) {
      delete t2[o2[e2]];
    }
    return ce = { PLATFORM: r2, OS: s2, APPID: i2, DEVICEID: n2, ...he(), ...t2 }, { ...ce, locale: e, LOCALE: e };
  }
  var de = { sign: function(e, t2) {
    let n2 = "";
    return Object.keys(e).sort().forEach(function(t3) {
      e[t3] && (n2 = n2 + "&" + t3 + "=" + e[t3]);
    }), n2 = n2.slice(1), o(n2, t2).toString();
  }, wrappedRequest: function(e, t2) {
    return new Promise((n2, s2) => {
      t2(Object.assign(e, { complete(e2) {
        e2 || (e2 = {});
        const t3 = e2.data && e2.data.header && e2.data.header["x-serverless-request-id"] || e2.header && e2.header["request-id"];
        if (!e2.statusCode || e2.statusCode >= 400)
          return s2(new ne({ code: "SYS_ERR", message: e2.errMsg || "request:fail", requestId: t3 }));
        const r2 = e2.data;
        if (r2.error)
          return s2(new ne({ code: r2.error.code, message: r2.error.message, requestId: t3 }));
        r2.result = r2.data, r2.requestId = t3, delete r2.data, n2(r2);
      } }));
    });
  }, toBase64: function(e) {
    return c.stringify(a.parse(e));
  } }, pe = { "uniCloud.init.paramRequired": "{param} required", "uniCloud.uploadFile.fileError": "filePath should be instance of File" };
  const { t: fe } = initVueI18n({ "zh-Hans": { "uniCloud.init.paramRequired": "缺少参数：{param}", "uniCloud.uploadFile.fileError": "filePath应为File对象" }, "zh-Hant": { "uniCloud.init.paramRequired": "缺少参数：{param}", "uniCloud.uploadFile.fileError": "filePath应为File对象" }, en: pe, fr: { "uniCloud.init.paramRequired": "{param} required", "uniCloud.uploadFile.fileError": "filePath should be instance of File" }, es: { "uniCloud.init.paramRequired": "{param} required", "uniCloud.uploadFile.fileError": "filePath should be instance of File" }, ja: pe }, "zh-Hans");
  var ge = class {
    constructor(e) {
      ["spaceId", "clientSecret"].forEach((t2) => {
        if (!Object.prototype.hasOwnProperty.call(e, t2))
          throw new Error(fe("uniCloud.init.paramRequired", { param: t2 }));
      }), this.config = Object.assign({}, { endpoint: 0 === e.spaceId.indexOf("mp-") ? "https://api.next.bspapp.com" : "https://api.bspapp.com" }, e), this.config.provider = "aliyun", this.config.requestUrl = this.config.endpoint + "/client", this.config.envType = this.config.envType || "public", this.config.accessTokenKey = "access_token_" + this.config.spaceId, this.adapter = se, this._getAccessTokenPromiseHub = new I({ createPromise: () => this.requestAuth(this.setupRequest({ method: "serverless.auth.user.anonymousAuthorize", params: "{}" }, "auth")).then((e2) => {
        if (!e2.result || !e2.result.accessToken)
          throw new ne({ code: "AUTH_FAILED", message: "获取accessToken失败" });
        this.setAccessToken(e2.result.accessToken);
      }), retryRule: v });
    }
    get hasAccessToken() {
      return !!this.accessToken;
    }
    setAccessToken(e) {
      this.accessToken = e;
    }
    requestWrapped(e) {
      return de.wrappedRequest(e, this.adapter.request);
    }
    requestAuth(e) {
      return this.requestWrapped(e);
    }
    request(e, t2) {
      return Promise.resolve().then(() => this.hasAccessToken ? t2 ? this.requestWrapped(e) : this.requestWrapped(e).catch((t3) => new Promise((e2, n2) => {
        !t3 || "GATEWAY_INVALID_TOKEN" !== t3.code && "InvalidParameter.InvalidToken" !== t3.code ? n2(t3) : e2();
      }).then(() => this.getAccessToken()).then(() => {
        const t4 = this.rebuildRequest(e);
        return this.request(t4, true);
      })) : this.getAccessToken().then(() => {
        const t3 = this.rebuildRequest(e);
        return this.request(t3, true);
      }));
    }
    rebuildRequest(e) {
      const t2 = Object.assign({}, e);
      return t2.data.token = this.accessToken, t2.header["x-basement-token"] = this.accessToken, t2.header["x-serverless-sign"] = de.sign(t2.data, this.config.clientSecret), t2;
    }
    setupRequest(e, t2) {
      const n2 = Object.assign({}, e, { spaceId: this.config.spaceId, timestamp: Date.now() }), s2 = { "Content-Type": "application/json" };
      return "auth" !== t2 && (n2.token = this.accessToken, s2["x-basement-token"] = this.accessToken), s2["x-serverless-sign"] = de.sign(n2, this.config.clientSecret), { url: this.config.requestUrl, method: "POST", data: n2, dataType: "json", header: s2 };
    }
    getAccessToken() {
      return this._getAccessTokenPromiseHub.exec();
    }
    async authorize() {
      await this.getAccessToken();
    }
    callFunction(e) {
      const t2 = { method: "serverless.function.runtime.invoke", params: JSON.stringify({ functionTarget: e.name, functionArgs: e.data || {} }) };
      return this.request(this.setupRequest(t2));
    }
    getOSSUploadOptionsFromPath(e) {
      const t2 = { method: "serverless.file.resource.generateProximalSign", params: JSON.stringify(e) };
      return this.request(this.setupRequest(t2));
    }
    uploadFileToOSS({ url: e, formData: t2, name: n2, filePath: s2, fileType: r2, onUploadProgress: i2 }) {
      return new Promise((o2, a2) => {
        const c2 = this.adapter.uploadFile({ url: e, formData: t2, name: n2, filePath: s2, fileType: r2, header: { "X-OSS-server-side-encrpytion": "AES256" }, success(e2) {
          e2 && e2.statusCode < 400 ? o2(e2) : a2(new ne({ code: "UPLOAD_FAILED", message: "文件上传失败" }));
        }, fail(e2) {
          a2(new ne({ code: e2.code || "UPLOAD_FAILED", message: e2.message || e2.errMsg || "文件上传失败" }));
        } });
        "function" == typeof i2 && c2 && "function" == typeof c2.onProgressUpdate && c2.onProgressUpdate((e2) => {
          i2({ loaded: e2.totalBytesSent, total: e2.totalBytesExpectedToSend });
        });
      });
    }
    reportOSSUpload(e) {
      const t2 = { method: "serverless.file.resource.report", params: JSON.stringify(e) };
      return this.request(this.setupRequest(t2));
    }
    async uploadFile({ filePath: e, cloudPath: t2, fileType: n2 = "image", onUploadProgress: s2, config: r2 }) {
      if ("string" !== g(t2))
        throw new ne({ code: "INVALID_PARAM", message: "cloudPath必须为字符串类型" });
      if (!(t2 = t2.trim()))
        throw new ne({ code: "CLOUDPATH_REQUIRED", message: "cloudPath不可为空" });
      if (/:\/\//.test(t2))
        throw new ne({ code: "INVALID_PARAM", message: "cloudPath不合法" });
      const i2 = r2 && r2.envType || this.config.envType, o2 = (await this.getOSSUploadOptionsFromPath({ env: i2, filename: t2 })).result, a2 = "https://" + o2.cdnDomain + "/" + o2.ossPath, { securityToken: c2, accessKeyId: u2, signature: h2, host: l2, ossPath: d2, id: p2, policy: f2, ossCallbackUrl: m2 } = o2, y2 = { "Cache-Control": "max-age=2592000", "Content-Disposition": "attachment", OSSAccessKeyId: u2, Signature: h2, host: l2, id: p2, key: d2, policy: f2, success_action_status: 200 };
      if (c2 && (y2["x-oss-security-token"] = c2), m2) {
        const e2 = JSON.stringify({ callbackUrl: m2, callbackBody: JSON.stringify({ fileId: p2, spaceId: this.config.spaceId }), callbackBodyType: "application/json" });
        y2.callback = de.toBase64(e2);
      }
      const _2 = { url: "https://" + o2.host, formData: y2, fileName: "file", name: "file", filePath: e, fileType: n2 };
      if (await this.uploadFileToOSS(Object.assign({}, _2, { onUploadProgress: s2 })), m2)
        return { success: true, filePath: e, fileID: a2 };
      if ((await this.reportOSSUpload({ id: p2 })).success)
        return { success: true, filePath: e, fileID: a2 };
      throw new ne({ code: "UPLOAD_FAILED", message: "文件上传失败" });
    }
    getTempFileURL({ fileList: e } = {}) {
      return new Promise((t2, n2) => {
        Array.isArray(e) && 0 !== e.length || n2(new ne({ code: "INVALID_PARAM", message: "fileList的元素必须是非空的字符串" })), t2({ fileList: e.map((e2) => ({ fileID: e2, tempFileURL: e2 })) });
      });
    }
    async getFileInfo({ fileList: e } = {}) {
      if (!Array.isArray(e) || 0 === e.length)
        throw new ne({ code: "INVALID_PARAM", message: "fileList的元素必须是非空的字符串" });
      const t2 = { method: "serverless.file.resource.info", params: JSON.stringify({ id: e.map((e2) => e2.split("?")[0]).join(",") }) };
      return { fileList: (await this.request(this.setupRequest(t2))).result };
    }
  };
  var me = { init(e) {
    const t2 = new ge(e), n2 = { signInAnonymously: function() {
      return t2.authorize();
    }, getLoginState: function() {
      return Promise.resolve(false);
    } };
    return t2.auth = function() {
      return n2;
    }, t2.customAuth = t2.auth, t2;
  } };
  const ye = "undefined" != typeof location && "http:" === location.protocol ? "http:" : "https:";
  var _e;
  !function(e) {
    e.local = "local", e.none = "none", e.session = "session";
  }(_e || (_e = {}));
  var we = function() {
  };
  const ve = () => {
    let e;
    if (!Promise) {
      e = () => {
      }, e.promise = {};
      const t3 = () => {
        throw new ne({ message: 'Your Node runtime does support ES6 Promises. Set "global.Promise" to your preferred implementation of promises.' });
      };
      return Object.defineProperty(e.promise, "then", { get: t3 }), Object.defineProperty(e.promise, "catch", { get: t3 }), e;
    }
    const t2 = new Promise((t3, n2) => {
      e = (e2, s2) => e2 ? n2(e2) : t3(s2);
    });
    return e.promise = t2, e;
  };
  function Ie(e) {
    return void 0 === e;
  }
  function Se(e) {
    return "[object Null]" === Object.prototype.toString.call(e);
  }
  var be;
  function ke(e) {
    const t2 = (n2 = e, "[object Array]" === Object.prototype.toString.call(n2) ? e : [e]);
    var n2;
    for (const e2 of t2) {
      const { isMatch: t3, genAdapter: n3, runtime: s2 } = e2;
      if (t3())
        return { adapter: n3(), runtime: s2 };
    }
  }
  !function(e) {
    e.WEB = "web", e.WX_MP = "wx_mp";
  }(be || (be = {}));
  const Ce = { adapter: null, runtime: void 0 }, Te = ["anonymousUuidKey"];
  class Pe extends we {
    constructor() {
      super(), Ce.adapter.root.tcbObject || (Ce.adapter.root.tcbObject = {});
    }
    setItem(e, t2) {
      Ce.adapter.root.tcbObject[e] = t2;
    }
    getItem(e) {
      return Ce.adapter.root.tcbObject[e];
    }
    removeItem(e) {
      delete Ce.adapter.root.tcbObject[e];
    }
    clear() {
      delete Ce.adapter.root.tcbObject;
    }
  }
  function Ae(e, t2) {
    switch (e) {
      case "local":
        return t2.localStorage || new Pe();
      case "none":
        return new Pe();
      default:
        return t2.sessionStorage || new Pe();
    }
  }
  class Ee {
    constructor(e) {
      if (!this._storage) {
        this._persistence = Ce.adapter.primaryStorage || e.persistence, this._storage = Ae(this._persistence, Ce.adapter);
        const t2 = `access_token_${e.env}`, n2 = `access_token_expire_${e.env}`, s2 = `refresh_token_${e.env}`, r2 = `anonymous_uuid_${e.env}`, i2 = `login_type_${e.env}`, o2 = `user_info_${e.env}`;
        this.keys = { accessTokenKey: t2, accessTokenExpireKey: n2, refreshTokenKey: s2, anonymousUuidKey: r2, loginTypeKey: i2, userInfoKey: o2 };
      }
    }
    updatePersistence(e) {
      if (e === this._persistence)
        return;
      const t2 = "local" === this._persistence;
      this._persistence = e;
      const n2 = Ae(e, Ce.adapter);
      for (const e2 in this.keys) {
        const s2 = this.keys[e2];
        if (t2 && Te.includes(e2))
          continue;
        const r2 = this._storage.getItem(s2);
        Ie(r2) || Se(r2) || (n2.setItem(s2, r2), this._storage.removeItem(s2));
      }
      this._storage = n2;
    }
    setStore(e, t2, n2) {
      if (!this._storage)
        return;
      const s2 = { version: n2 || "localCachev1", content: t2 }, r2 = JSON.stringify(s2);
      try {
        this._storage.setItem(e, r2);
      } catch (e2) {
        throw e2;
      }
    }
    getStore(e, t2) {
      try {
        if (!this._storage)
          return;
      } catch (e2) {
        return "";
      }
      t2 = t2 || "localCachev1";
      const n2 = this._storage.getItem(e);
      if (!n2)
        return "";
      if (n2.indexOf(t2) >= 0) {
        return JSON.parse(n2).content;
      }
      return "";
    }
    removeStore(e) {
      this._storage.removeItem(e);
    }
  }
  const Oe = {}, xe = {};
  function Re(e) {
    return Oe[e];
  }
  class Ue {
    constructor(e, t2) {
      this.data = t2 || null, this.name = e;
    }
  }
  class Le extends Ue {
    constructor(e, t2) {
      super("error", { error: e, data: t2 }), this.error = e;
    }
  }
  const Ne = new class {
    constructor() {
      this._listeners = {};
    }
    on(e, t2) {
      return function(e2, t3, n2) {
        n2[e2] = n2[e2] || [], n2[e2].push(t3);
      }(e, t2, this._listeners), this;
    }
    off(e, t2) {
      return function(e2, t3, n2) {
        if (n2 && n2[e2]) {
          const s2 = n2[e2].indexOf(t3);
          -1 !== s2 && n2[e2].splice(s2, 1);
        }
      }(e, t2, this._listeners), this;
    }
    fire(e, t2) {
      if (e instanceof Le)
        return console.error(e.error), this;
      const n2 = "string" == typeof e ? new Ue(e, t2 || {}) : e;
      const s2 = n2.name;
      if (this._listens(s2)) {
        n2.target = this;
        const e2 = this._listeners[s2] ? [...this._listeners[s2]] : [];
        for (const t3 of e2)
          t3.call(this, n2);
      }
      return this;
    }
    _listens(e) {
      return this._listeners[e] && this._listeners[e].length > 0;
    }
  }();
  function De(e, t2) {
    Ne.on(e, t2);
  }
  function Fe(e, t2 = {}) {
    Ne.fire(e, t2);
  }
  function qe(e, t2) {
    Ne.off(e, t2);
  }
  const Me = "loginStateChanged", Ke = "loginStateExpire", je = "loginTypeChanged", Be = "anonymousConverted", $e = "refreshAccessToken";
  var We;
  !function(e) {
    e.ANONYMOUS = "ANONYMOUS", e.WECHAT = "WECHAT", e.WECHAT_PUBLIC = "WECHAT-PUBLIC", e.WECHAT_OPEN = "WECHAT-OPEN", e.CUSTOM = "CUSTOM", e.EMAIL = "EMAIL", e.USERNAME = "USERNAME", e.NULL = "NULL";
  }(We || (We = {}));
  const ze = ["auth.getJwt", "auth.logout", "auth.signInWithTicket", "auth.signInAnonymously", "auth.signIn", "auth.fetchAccessTokenWithRefreshToken", "auth.signUpWithEmailAndPassword", "auth.activateEndUserMail", "auth.sendPasswordResetEmail", "auth.resetPasswordWithToken", "auth.isUsernameRegistered"], Je = { "X-SDK-Version": "1.3.5" };
  function He(e, t2, n2) {
    const s2 = e[t2];
    e[t2] = function(t3) {
      const r2 = {}, i2 = {};
      n2.forEach((n3) => {
        const { data: s3, headers: o3 } = n3.call(e, t3);
        Object.assign(r2, s3), Object.assign(i2, o3);
      });
      const o2 = t3.data;
      return o2 && (() => {
        var e2;
        if (e2 = o2, "[object FormData]" !== Object.prototype.toString.call(e2))
          t3.data = { ...o2, ...r2 };
        else
          for (const e3 in r2)
            o2.append(e3, r2[e3]);
      })(), t3.headers = { ...t3.headers || {}, ...i2 }, s2.call(e, t3);
    };
  }
  function Ge() {
    const e = Math.random().toString(16).slice(2);
    return { data: { seqId: e }, headers: { ...Je, "x-seqid": e } };
  }
  class Ve {
    constructor(e = {}) {
      var t2;
      this.config = e, this._reqClass = new Ce.adapter.reqClass({ timeout: this.config.timeout, timeoutMsg: `请求在${this.config.timeout / 1e3}s内未完成，已中断`, restrictedMethods: ["post"] }), this._cache = Re(this.config.env), this._localCache = (t2 = this.config.env, xe[t2]), He(this._reqClass, "post", [Ge]), He(this._reqClass, "upload", [Ge]), He(this._reqClass, "download", [Ge]);
    }
    async post(e) {
      return await this._reqClass.post(e);
    }
    async upload(e) {
      return await this._reqClass.upload(e);
    }
    async download(e) {
      return await this._reqClass.download(e);
    }
    async refreshAccessToken() {
      let e, t2;
      this._refreshAccessTokenPromise || (this._refreshAccessTokenPromise = this._refreshAccessToken());
      try {
        e = await this._refreshAccessTokenPromise;
      } catch (e2) {
        t2 = e2;
      }
      if (this._refreshAccessTokenPromise = null, this._shouldRefreshAccessTokenHook = null, t2)
        throw t2;
      return e;
    }
    async _refreshAccessToken() {
      const { accessTokenKey: e, accessTokenExpireKey: t2, refreshTokenKey: n2, loginTypeKey: s2, anonymousUuidKey: r2 } = this._cache.keys;
      this._cache.removeStore(e), this._cache.removeStore(t2);
      let i2 = this._cache.getStore(n2);
      if (!i2)
        throw new ne({ message: "未登录CloudBase" });
      const o2 = { refresh_token: i2 }, a2 = await this.request("auth.fetchAccessTokenWithRefreshToken", o2);
      if (a2.data.code) {
        const { code: e2 } = a2.data;
        if ("SIGN_PARAM_INVALID" === e2 || "REFRESH_TOKEN_EXPIRED" === e2 || "INVALID_REFRESH_TOKEN" === e2) {
          if (this._cache.getStore(s2) === We.ANONYMOUS && "INVALID_REFRESH_TOKEN" === e2) {
            const e3 = this._cache.getStore(r2), t3 = this._cache.getStore(n2), s3 = await this.send("auth.signInAnonymously", { anonymous_uuid: e3, refresh_token: t3 });
            return this.setRefreshToken(s3.refresh_token), this._refreshAccessToken();
          }
          Fe(Ke), this._cache.removeStore(n2);
        }
        throw new ne({ code: a2.data.code, message: `刷新access token失败：${a2.data.code}` });
      }
      if (a2.data.access_token)
        return Fe($e), this._cache.setStore(e, a2.data.access_token), this._cache.setStore(t2, a2.data.access_token_expire + Date.now()), { accessToken: a2.data.access_token, accessTokenExpire: a2.data.access_token_expire };
      a2.data.refresh_token && (this._cache.removeStore(n2), this._cache.setStore(n2, a2.data.refresh_token), this._refreshAccessToken());
    }
    async getAccessToken() {
      const { accessTokenKey: e, accessTokenExpireKey: t2, refreshTokenKey: n2 } = this._cache.keys;
      if (!this._cache.getStore(n2))
        throw new ne({ message: "refresh token不存在，登录状态异常" });
      let s2 = this._cache.getStore(e), r2 = this._cache.getStore(t2), i2 = true;
      return this._shouldRefreshAccessTokenHook && !await this._shouldRefreshAccessTokenHook(s2, r2) && (i2 = false), (!s2 || !r2 || r2 < Date.now()) && i2 ? this.refreshAccessToken() : { accessToken: s2, accessTokenExpire: r2 };
    }
    async request(e, t2, n2) {
      const s2 = `x-tcb-trace_${this.config.env}`;
      let r2 = "application/x-www-form-urlencoded";
      const i2 = { action: e, env: this.config.env, dataVersion: "2019-08-16", ...t2 };
      if (-1 === ze.indexOf(e)) {
        const { refreshTokenKey: e2 } = this._cache.keys;
        this._cache.getStore(e2) && (i2.access_token = (await this.getAccessToken()).accessToken);
      }
      let o2;
      if ("storage.uploadFile" === e) {
        o2 = new FormData();
        for (let e2 in o2)
          o2.hasOwnProperty(e2) && void 0 !== o2[e2] && o2.append(e2, i2[e2]);
        r2 = "multipart/form-data";
      } else {
        r2 = "application/json", o2 = {};
        for (let e2 in i2)
          void 0 !== i2[e2] && (o2[e2] = i2[e2]);
      }
      let a2 = { headers: { "content-type": r2 } };
      n2 && n2.onUploadProgress && (a2.onUploadProgress = n2.onUploadProgress);
      const c2 = this._localCache.getStore(s2);
      c2 && (a2.headers["X-TCB-Trace"] = c2);
      const { parse: u2, inQuery: h2, search: l2 } = t2;
      let d2 = { env: this.config.env };
      u2 && (d2.parse = true), h2 && (d2 = { ...h2, ...d2 });
      let p2 = function(e2, t3, n3 = {}) {
        const s3 = /\?/.test(t3);
        let r3 = "";
        for (let e3 in n3)
          "" === r3 ? !s3 && (t3 += "?") : r3 += "&", r3 += `${e3}=${encodeURIComponent(n3[e3])}`;
        return /^http(s)?\:\/\//.test(t3 += r3) ? t3 : `${e2}${t3}`;
      }(ye, "//tcb-api.tencentcloudapi.com/web", d2);
      l2 && (p2 += l2);
      const f2 = await this.post({ url: p2, data: o2, ...a2 }), g2 = f2.header && f2.header["x-tcb-trace"];
      if (g2 && this._localCache.setStore(s2, g2), 200 !== Number(f2.status) && 200 !== Number(f2.statusCode) || !f2.data)
        throw new ne({ code: "NETWORK_ERROR", message: "network request error" });
      return f2;
    }
    async send(e, t2 = {}) {
      const n2 = await this.request(e, t2, { onUploadProgress: t2.onUploadProgress });
      if ("ACCESS_TOKEN_EXPIRED" === n2.data.code && -1 === ze.indexOf(e)) {
        await this.refreshAccessToken();
        const n3 = await this.request(e, t2, { onUploadProgress: t2.onUploadProgress });
        if (n3.data.code)
          throw new ne({ code: n3.data.code, message: n3.data.message });
        return n3.data;
      }
      if (n2.data.code)
        throw new ne({ code: n2.data.code, message: n2.data.message });
      return n2.data;
    }
    setRefreshToken(e) {
      const { accessTokenKey: t2, accessTokenExpireKey: n2, refreshTokenKey: s2 } = this._cache.keys;
      this._cache.removeStore(t2), this._cache.removeStore(n2), this._cache.setStore(s2, e);
    }
  }
  const Qe = {};
  function Ye(e) {
    return Qe[e];
  }
  class Xe {
    constructor(e) {
      this.config = e, this._cache = Re(e.env), this._request = Ye(e.env);
    }
    setRefreshToken(e) {
      const { accessTokenKey: t2, accessTokenExpireKey: n2, refreshTokenKey: s2 } = this._cache.keys;
      this._cache.removeStore(t2), this._cache.removeStore(n2), this._cache.setStore(s2, e);
    }
    setAccessToken(e, t2) {
      const { accessTokenKey: n2, accessTokenExpireKey: s2 } = this._cache.keys;
      this._cache.setStore(n2, e), this._cache.setStore(s2, t2);
    }
    async refreshUserInfo() {
      const { data: e } = await this._request.send("auth.getUserInfo", {});
      return this.setLocalUserInfo(e), e;
    }
    setLocalUserInfo(e) {
      const { userInfoKey: t2 } = this._cache.keys;
      this._cache.setStore(t2, e);
    }
  }
  class Ze {
    constructor(e) {
      if (!e)
        throw new ne({ code: "PARAM_ERROR", message: "envId is not defined" });
      this._envId = e, this._cache = Re(this._envId), this._request = Ye(this._envId), this.setUserInfo();
    }
    linkWithTicket(e) {
      if ("string" != typeof e)
        throw new ne({ code: "PARAM_ERROR", message: "ticket must be string" });
      return this._request.send("auth.linkWithTicket", { ticket: e });
    }
    linkWithRedirect(e) {
      e.signInWithRedirect();
    }
    updatePassword(e, t2) {
      return this._request.send("auth.updatePassword", { oldPassword: t2, newPassword: e });
    }
    updateEmail(e) {
      return this._request.send("auth.updateEmail", { newEmail: e });
    }
    updateUsername(e) {
      if ("string" != typeof e)
        throw new ne({ code: "PARAM_ERROR", message: "username must be a string" });
      return this._request.send("auth.updateUsername", { username: e });
    }
    async getLinkedUidList() {
      const { data: e } = await this._request.send("auth.getLinkedUidList", {});
      let t2 = false;
      const { users: n2 } = e;
      return n2.forEach((e2) => {
        e2.wxOpenId && e2.wxPublicId && (t2 = true);
      }), { users: n2, hasPrimaryUid: t2 };
    }
    setPrimaryUid(e) {
      return this._request.send("auth.setPrimaryUid", { uid: e });
    }
    unlink(e) {
      return this._request.send("auth.unlink", { platform: e });
    }
    async update(e) {
      const { nickName: t2, gender: n2, avatarUrl: s2, province: r2, country: i2, city: o2 } = e, { data: a2 } = await this._request.send("auth.updateUserInfo", { nickName: t2, gender: n2, avatarUrl: s2, province: r2, country: i2, city: o2 });
      this.setLocalUserInfo(a2);
    }
    async refresh() {
      const { data: e } = await this._request.send("auth.getUserInfo", {});
      return this.setLocalUserInfo(e), e;
    }
    setUserInfo() {
      const { userInfoKey: e } = this._cache.keys, t2 = this._cache.getStore(e);
      ["uid", "loginType", "openid", "wxOpenId", "wxPublicId", "unionId", "qqMiniOpenId", "email", "hasPassword", "customUserId", "nickName", "gender", "avatarUrl"].forEach((e2) => {
        this[e2] = t2[e2];
      }), this.location = { country: t2.country, province: t2.province, city: t2.city };
    }
    setLocalUserInfo(e) {
      const { userInfoKey: t2 } = this._cache.keys;
      this._cache.setStore(t2, e), this.setUserInfo();
    }
  }
  class et {
    constructor(e) {
      if (!e)
        throw new ne({ code: "PARAM_ERROR", message: "envId is not defined" });
      this._cache = Re(e);
      const { refreshTokenKey: t2, accessTokenKey: n2, accessTokenExpireKey: s2 } = this._cache.keys, r2 = this._cache.getStore(t2), i2 = this._cache.getStore(n2), o2 = this._cache.getStore(s2);
      this.credential = { refreshToken: r2, accessToken: i2, accessTokenExpire: o2 }, this.user = new Ze(e);
    }
    get isAnonymousAuth() {
      return this.loginType === We.ANONYMOUS;
    }
    get isCustomAuth() {
      return this.loginType === We.CUSTOM;
    }
    get isWeixinAuth() {
      return this.loginType === We.WECHAT || this.loginType === We.WECHAT_OPEN || this.loginType === We.WECHAT_PUBLIC;
    }
    get loginType() {
      return this._cache.getStore(this._cache.keys.loginTypeKey);
    }
  }
  class tt extends Xe {
    async signIn() {
      this._cache.updatePersistence("local");
      const { anonymousUuidKey: e, refreshTokenKey: t2 } = this._cache.keys, n2 = this._cache.getStore(e) || void 0, s2 = this._cache.getStore(t2) || void 0, r2 = await this._request.send("auth.signInAnonymously", { anonymous_uuid: n2, refresh_token: s2 });
      if (r2.uuid && r2.refresh_token) {
        this._setAnonymousUUID(r2.uuid), this.setRefreshToken(r2.refresh_token), await this._request.refreshAccessToken(), Fe(Me), Fe(je, { env: this.config.env, loginType: We.ANONYMOUS, persistence: "local" });
        const e2 = new et(this.config.env);
        return await e2.user.refresh(), e2;
      }
      throw new ne({ message: "匿名登录失败" });
    }
    async linkAndRetrieveDataWithTicket(e) {
      const { anonymousUuidKey: t2, refreshTokenKey: n2 } = this._cache.keys, s2 = this._cache.getStore(t2), r2 = this._cache.getStore(n2), i2 = await this._request.send("auth.linkAndRetrieveDataWithTicket", { anonymous_uuid: s2, refresh_token: r2, ticket: e });
      if (i2.refresh_token)
        return this._clearAnonymousUUID(), this.setRefreshToken(i2.refresh_token), await this._request.refreshAccessToken(), Fe(Be, { env: this.config.env }), Fe(je, { loginType: We.CUSTOM, persistence: "local" }), { credential: { refreshToken: i2.refresh_token } };
      throw new ne({ message: "匿名转化失败" });
    }
    _setAnonymousUUID(e) {
      const { anonymousUuidKey: t2, loginTypeKey: n2 } = this._cache.keys;
      this._cache.removeStore(t2), this._cache.setStore(t2, e), this._cache.setStore(n2, We.ANONYMOUS);
    }
    _clearAnonymousUUID() {
      this._cache.removeStore(this._cache.keys.anonymousUuidKey);
    }
  }
  class nt extends Xe {
    async signIn(e) {
      if ("string" != typeof e)
        throw new ne({ code: "PARAM_ERROR", message: "ticket must be a string" });
      const { refreshTokenKey: t2 } = this._cache.keys, n2 = await this._request.send("auth.signInWithTicket", { ticket: e, refresh_token: this._cache.getStore(t2) || "" });
      if (n2.refresh_token)
        return this.setRefreshToken(n2.refresh_token), await this._request.refreshAccessToken(), Fe(Me), Fe(je, { env: this.config.env, loginType: We.CUSTOM, persistence: this.config.persistence }), await this.refreshUserInfo(), new et(this.config.env);
      throw new ne({ message: "自定义登录失败" });
    }
  }
  class st extends Xe {
    async signIn(e, t2) {
      if ("string" != typeof e)
        throw new ne({ code: "PARAM_ERROR", message: "email must be a string" });
      const { refreshTokenKey: n2 } = this._cache.keys, s2 = await this._request.send("auth.signIn", { loginType: "EMAIL", email: e, password: t2, refresh_token: this._cache.getStore(n2) || "" }), { refresh_token: r2, access_token: i2, access_token_expire: o2 } = s2;
      if (r2)
        return this.setRefreshToken(r2), i2 && o2 ? this.setAccessToken(i2, o2) : await this._request.refreshAccessToken(), await this.refreshUserInfo(), Fe(Me), Fe(je, { env: this.config.env, loginType: We.EMAIL, persistence: this.config.persistence }), new et(this.config.env);
      throw s2.code ? new ne({ code: s2.code, message: `邮箱登录失败: ${s2.message}` }) : new ne({ message: "邮箱登录失败" });
    }
    async activate(e) {
      return this._request.send("auth.activateEndUserMail", { token: e });
    }
    async resetPasswordWithToken(e, t2) {
      return this._request.send("auth.resetPasswordWithToken", { token: e, newPassword: t2 });
    }
  }
  class rt extends Xe {
    async signIn(e, t2) {
      if ("string" != typeof e)
        throw new ne({ code: "PARAM_ERROR", message: "username must be a string" });
      "string" != typeof t2 && (t2 = "", console.warn("password is empty"));
      const { refreshTokenKey: n2 } = this._cache.keys, s2 = await this._request.send("auth.signIn", { loginType: We.USERNAME, username: e, password: t2, refresh_token: this._cache.getStore(n2) || "" }), { refresh_token: r2, access_token_expire: i2, access_token: o2 } = s2;
      if (r2)
        return this.setRefreshToken(r2), o2 && i2 ? this.setAccessToken(o2, i2) : await this._request.refreshAccessToken(), await this.refreshUserInfo(), Fe(Me), Fe(je, { env: this.config.env, loginType: We.USERNAME, persistence: this.config.persistence }), new et(this.config.env);
      throw s2.code ? new ne({ code: s2.code, message: `用户名密码登录失败: ${s2.message}` }) : new ne({ message: "用户名密码登录失败" });
    }
  }
  class it {
    constructor(e) {
      this.config = e, this._cache = Re(e.env), this._request = Ye(e.env), this._onAnonymousConverted = this._onAnonymousConverted.bind(this), this._onLoginTypeChanged = this._onLoginTypeChanged.bind(this), De(je, this._onLoginTypeChanged);
    }
    get currentUser() {
      const e = this.hasLoginState();
      return e && e.user || null;
    }
    get loginType() {
      return this._cache.getStore(this._cache.keys.loginTypeKey);
    }
    anonymousAuthProvider() {
      return new tt(this.config);
    }
    customAuthProvider() {
      return new nt(this.config);
    }
    emailAuthProvider() {
      return new st(this.config);
    }
    usernameAuthProvider() {
      return new rt(this.config);
    }
    async signInAnonymously() {
      return new tt(this.config).signIn();
    }
    async signInWithEmailAndPassword(e, t2) {
      return new st(this.config).signIn(e, t2);
    }
    signInWithUsernameAndPassword(e, t2) {
      return new rt(this.config).signIn(e, t2);
    }
    async linkAndRetrieveDataWithTicket(e) {
      this._anonymousAuthProvider || (this._anonymousAuthProvider = new tt(this.config)), De(Be, this._onAnonymousConverted);
      return await this._anonymousAuthProvider.linkAndRetrieveDataWithTicket(e);
    }
    async signOut() {
      if (this.loginType === We.ANONYMOUS)
        throw new ne({ message: "匿名用户不支持登出操作" });
      const { refreshTokenKey: e, accessTokenKey: t2, accessTokenExpireKey: n2 } = this._cache.keys, s2 = this._cache.getStore(e);
      if (!s2)
        return;
      const r2 = await this._request.send("auth.logout", { refresh_token: s2 });
      return this._cache.removeStore(e), this._cache.removeStore(t2), this._cache.removeStore(n2), Fe(Me), Fe(je, { env: this.config.env, loginType: We.NULL, persistence: this.config.persistence }), r2;
    }
    async signUpWithEmailAndPassword(e, t2) {
      return this._request.send("auth.signUpWithEmailAndPassword", { email: e, password: t2 });
    }
    async sendPasswordResetEmail(e) {
      return this._request.send("auth.sendPasswordResetEmail", { email: e });
    }
    onLoginStateChanged(e) {
      De(Me, () => {
        const t3 = this.hasLoginState();
        e.call(this, t3);
      });
      const t2 = this.hasLoginState();
      e.call(this, t2);
    }
    onLoginStateExpired(e) {
      De(Ke, e.bind(this));
    }
    onAccessTokenRefreshed(e) {
      De($e, e.bind(this));
    }
    onAnonymousConverted(e) {
      De(Be, e.bind(this));
    }
    onLoginTypeChanged(e) {
      De(je, () => {
        const t2 = this.hasLoginState();
        e.call(this, t2);
      });
    }
    async getAccessToken() {
      return { accessToken: (await this._request.getAccessToken()).accessToken, env: this.config.env };
    }
    hasLoginState() {
      const { refreshTokenKey: e } = this._cache.keys;
      return this._cache.getStore(e) ? new et(this.config.env) : null;
    }
    async isUsernameRegistered(e) {
      if ("string" != typeof e)
        throw new ne({ code: "PARAM_ERROR", message: "username must be a string" });
      const { data: t2 } = await this._request.send("auth.isUsernameRegistered", { username: e });
      return t2 && t2.isRegistered;
    }
    getLoginState() {
      return Promise.resolve(this.hasLoginState());
    }
    async signInWithTicket(e) {
      return new nt(this.config).signIn(e);
    }
    shouldRefreshAccessToken(e) {
      this._request._shouldRefreshAccessTokenHook = e.bind(this);
    }
    getUserInfo() {
      return this._request.send("auth.getUserInfo", {}).then((e) => e.code ? e : { ...e.data, requestId: e.seqId });
    }
    getAuthHeader() {
      const { refreshTokenKey: e, accessTokenKey: t2 } = this._cache.keys, n2 = this._cache.getStore(e);
      return { "x-cloudbase-credentials": this._cache.getStore(t2) + "/@@/" + n2 };
    }
    _onAnonymousConverted(e) {
      const { env: t2 } = e.data;
      t2 === this.config.env && this._cache.updatePersistence(this.config.persistence);
    }
    _onLoginTypeChanged(e) {
      const { loginType: t2, persistence: n2, env: s2 } = e.data;
      s2 === this.config.env && (this._cache.updatePersistence(n2), this._cache.setStore(this._cache.keys.loginTypeKey, t2));
    }
  }
  const ot = function(e, t2) {
    t2 = t2 || ve();
    const n2 = Ye(this.config.env), { cloudPath: s2, filePath: r2, onUploadProgress: i2, fileType: o2 = "image" } = e;
    return n2.send("storage.getUploadMetadata", { path: s2 }).then((e2) => {
      const { data: { url: a2, authorization: c2, token: u2, fileId: h2, cosFileId: l2 }, requestId: d2 } = e2, p2 = { key: s2, signature: c2, "x-cos-meta-fileid": l2, success_action_status: "201", "x-cos-security-token": u2 };
      n2.upload({ url: a2, data: p2, file: r2, name: s2, fileType: o2, onUploadProgress: i2 }).then((e3) => {
        201 === e3.statusCode ? t2(null, { fileID: h2, requestId: d2 }) : t2(new ne({ code: "STORAGE_REQUEST_FAIL", message: `STORAGE_REQUEST_FAIL: ${e3.data}` }));
      }).catch((e3) => {
        t2(e3);
      });
    }).catch((e2) => {
      t2(e2);
    }), t2.promise;
  }, at = function(e, t2) {
    t2 = t2 || ve();
    const n2 = Ye(this.config.env), { cloudPath: s2 } = e;
    return n2.send("storage.getUploadMetadata", { path: s2 }).then((e2) => {
      t2(null, e2);
    }).catch((e2) => {
      t2(e2);
    }), t2.promise;
  }, ct = function({ fileList: e }, t2) {
    if (t2 = t2 || ve(), !e || !Array.isArray(e))
      return { code: "INVALID_PARAM", message: "fileList必须是非空的数组" };
    for (let t3 of e)
      if (!t3 || "string" != typeof t3)
        return { code: "INVALID_PARAM", message: "fileList的元素必须是非空的字符串" };
    const n2 = { fileid_list: e };
    return Ye(this.config.env).send("storage.batchDeleteFile", n2).then((e2) => {
      e2.code ? t2(null, e2) : t2(null, { fileList: e2.data.delete_list, requestId: e2.requestId });
    }).catch((e2) => {
      t2(e2);
    }), t2.promise;
  }, ut = function({ fileList: e }, t2) {
    t2 = t2 || ve(), e && Array.isArray(e) || t2(null, { code: "INVALID_PARAM", message: "fileList必须是非空的数组" });
    let n2 = [];
    for (let s3 of e)
      "object" == typeof s3 ? (s3.hasOwnProperty("fileID") && s3.hasOwnProperty("maxAge") || t2(null, { code: "INVALID_PARAM", message: "fileList的元素必须是包含fileID和maxAge的对象" }), n2.push({ fileid: s3.fileID, max_age: s3.maxAge })) : "string" == typeof s3 ? n2.push({ fileid: s3 }) : t2(null, { code: "INVALID_PARAM", message: "fileList的元素必须是字符串" });
    const s2 = { file_list: n2 };
    return Ye(this.config.env).send("storage.batchGetDownloadUrl", s2).then((e2) => {
      e2.code ? t2(null, e2) : t2(null, { fileList: e2.data.download_list, requestId: e2.requestId });
    }).catch((e2) => {
      t2(e2);
    }), t2.promise;
  }, ht = async function({ fileID: e }, t2) {
    const n2 = (await ut.call(this, { fileList: [{ fileID: e, maxAge: 600 }] })).fileList[0];
    if ("SUCCESS" !== n2.code)
      return t2 ? t2(n2) : new Promise((e2) => {
        e2(n2);
      });
    const s2 = Ye(this.config.env);
    let r2 = n2.download_url;
    if (r2 = encodeURI(r2), !t2)
      return s2.download({ url: r2 });
    t2(await s2.download({ url: r2 }));
  }, lt = function({ name: e, data: t2, query: n2, parse: s2, search: r2 }, i2) {
    const o2 = i2 || ve();
    let a2;
    try {
      a2 = t2 ? JSON.stringify(t2) : "";
    } catch (e2) {
      return Promise.reject(e2);
    }
    if (!e)
      return Promise.reject(new ne({ code: "PARAM_ERROR", message: "函数名不能为空" }));
    const c2 = { inQuery: n2, parse: s2, search: r2, function_name: e, request_data: a2 };
    return Ye(this.config.env).send("functions.invokeFunction", c2).then((e2) => {
      if (e2.code)
        o2(null, e2);
      else {
        let t3 = e2.data.response_data;
        if (s2)
          o2(null, { result: t3, requestId: e2.requestId });
        else
          try {
            t3 = JSON.parse(e2.data.response_data), o2(null, { result: t3, requestId: e2.requestId });
          } catch (e3) {
            o2(new ne({ message: "response data must be json" }));
          }
      }
      return o2.promise;
    }).catch((e2) => {
      o2(e2);
    }), o2.promise;
  }, dt = { timeout: 15e3, persistence: "session" }, pt = {};
  class ft {
    constructor(e) {
      this.config = e || this.config, this.authObj = void 0;
    }
    init(e) {
      switch (Ce.adapter || (this.requestClient = new Ce.adapter.reqClass({ timeout: e.timeout || 5e3, timeoutMsg: `请求在${(e.timeout || 5e3) / 1e3}s内未完成，已中断` })), this.config = { ...dt, ...e }, true) {
        case this.config.timeout > 6e5:
          console.warn("timeout大于可配置上限[10分钟]，已重置为上限数值"), this.config.timeout = 6e5;
          break;
        case this.config.timeout < 100:
          console.warn("timeout小于可配置下限[100ms]，已重置为下限数值"), this.config.timeout = 100;
      }
      return new ft(this.config);
    }
    auth({ persistence: e } = {}) {
      if (this.authObj)
        return this.authObj;
      const t2 = e || Ce.adapter.primaryStorage || dt.persistence;
      var n2;
      return t2 !== this.config.persistence && (this.config.persistence = t2), function(e2) {
        const { env: t3 } = e2;
        Oe[t3] = new Ee(e2), xe[t3] = new Ee({ ...e2, persistence: "local" });
      }(this.config), n2 = this.config, Qe[n2.env] = new Ve(n2), this.authObj = new it(this.config), this.authObj;
    }
    on(e, t2) {
      return De.apply(this, [e, t2]);
    }
    off(e, t2) {
      return qe.apply(this, [e, t2]);
    }
    callFunction(e, t2) {
      return lt.apply(this, [e, t2]);
    }
    deleteFile(e, t2) {
      return ct.apply(this, [e, t2]);
    }
    getTempFileURL(e, t2) {
      return ut.apply(this, [e, t2]);
    }
    downloadFile(e, t2) {
      return ht.apply(this, [e, t2]);
    }
    uploadFile(e, t2) {
      return ot.apply(this, [e, t2]);
    }
    getUploadMetadata(e, t2) {
      return at.apply(this, [e, t2]);
    }
    registerExtension(e) {
      pt[e.name] = e;
    }
    async invokeExtension(e, t2) {
      const n2 = pt[e];
      if (!n2)
        throw new ne({ message: `扩展${e} 必须先注册` });
      return await n2.invoke(t2, this);
    }
    useAdapters(e) {
      const { adapter: t2, runtime: n2 } = ke(e) || {};
      t2 && (Ce.adapter = t2), n2 && (Ce.runtime = n2);
    }
  }
  var gt = new ft();
  function mt(e, t2, n2) {
    void 0 === n2 && (n2 = {});
    var s2 = /\?/.test(t2), r2 = "";
    for (var i2 in n2)
      "" === r2 ? !s2 && (t2 += "?") : r2 += "&", r2 += i2 + "=" + encodeURIComponent(n2[i2]);
    return /^http(s)?:\/\//.test(t2 += r2) ? t2 : "" + e + t2;
  }
  class yt {
    post(e) {
      const { url: t2, data: n2, headers: s2 } = e;
      return new Promise((e2, r2) => {
        se.request({ url: mt("https:", t2), data: n2, method: "POST", header: s2, success(t3) {
          e2(t3);
        }, fail(e3) {
          r2(e3);
        } });
      });
    }
    upload(e) {
      return new Promise((t2, n2) => {
        const { url: s2, file: r2, data: i2, headers: o2, fileType: a2 } = e, c2 = se.uploadFile({ url: mt("https:", s2), name: "file", formData: Object.assign({}, i2), filePath: r2, fileType: a2, header: o2, success(e2) {
          const n3 = { statusCode: e2.statusCode, data: e2.data || {} };
          200 === e2.statusCode && i2.success_action_status && (n3.statusCode = parseInt(i2.success_action_status, 10)), t2(n3);
        }, fail(e2) {
          n2(new Error(e2.errMsg || "uploadFile:fail"));
        } });
        "function" == typeof e.onUploadProgress && c2 && "function" == typeof c2.onProgressUpdate && c2.onProgressUpdate((t3) => {
          e.onUploadProgress({ loaded: t3.totalBytesSent, total: t3.totalBytesExpectedToSend });
        });
      });
    }
  }
  const _t = { setItem(e, t2) {
    se.setStorageSync(e, t2);
  }, getItem: (e) => se.getStorageSync(e), removeItem(e) {
    se.removeStorageSync(e);
  }, clear() {
    se.clearStorageSync();
  } };
  var wt = { genAdapter: function() {
    return { root: {}, reqClass: yt, localStorage: _t, primaryStorage: "local" };
  }, isMatch: function() {
    return true;
  }, runtime: "uni_app" };
  gt.useAdapters(wt);
  const vt = gt, It = vt.init;
  vt.init = function(e) {
    e.env = e.spaceId;
    const t2 = It.call(this, e);
    t2.config.provider = "tencent", t2.config.spaceId = e.spaceId;
    const n2 = t2.auth;
    return t2.auth = function(e2) {
      const t3 = n2.call(this, e2);
      return ["linkAndRetrieveDataWithTicket", "signInAnonymously", "signOut", "getAccessToken", "getLoginState", "signInWithTicket", "getUserInfo"].forEach((e3) => {
        var n3;
        t3[e3] = (n3 = t3[e3], function(e4) {
          e4 = e4 || {};
          const { success: t4, fail: s2, complete: r2 } = te(e4);
          if (!(t4 || s2 || r2))
            return n3.call(this, e4);
          n3.call(this, e4).then((e5) => {
            t4 && t4(e5), r2 && r2(e5);
          }, (e5) => {
            s2 && s2(e5), r2 && r2(e5);
          });
        }).bind(t3);
      }), t3;
    }, t2.customAuth = t2.auth, t2;
  };
  var St = vt;
  var bt = class extends ge {
    getAccessToken() {
      return new Promise((e, t2) => {
        const n2 = "Anonymous_Access_token";
        this.setAccessToken(n2), e(n2);
      });
    }
    setupRequest(e, t2) {
      const n2 = Object.assign({}, e, { spaceId: this.config.spaceId, timestamp: Date.now() }), s2 = { "Content-Type": "application/json" };
      "auth" !== t2 && (n2.token = this.accessToken, s2["x-basement-token"] = this.accessToken), s2["x-serverless-sign"] = de.sign(n2, this.config.clientSecret);
      const r2 = le();
      s2["x-client-info"] = encodeURIComponent(JSON.stringify(r2));
      const { token: i2 } = ie();
      return s2["x-client-token"] = i2, { url: this.config.requestUrl, method: "POST", data: n2, dataType: "json", header: JSON.parse(JSON.stringify(s2)) };
    }
    uploadFileToOSS({ url: e, formData: t2, name: n2, filePath: s2, fileType: r2, onUploadProgress: i2 }) {
      return new Promise((o2, a2) => {
        const c2 = this.adapter.uploadFile({ url: e, formData: t2, name: n2, filePath: s2, fileType: r2, success(e2) {
          e2 && e2.statusCode < 400 ? o2(e2) : a2(new ne({ code: "UPLOAD_FAILED", message: "文件上传失败" }));
        }, fail(e2) {
          a2(new ne({ code: e2.code || "UPLOAD_FAILED", message: e2.message || e2.errMsg || "文件上传失败" }));
        } });
        "function" == typeof i2 && c2 && "function" == typeof c2.onProgressUpdate && c2.onProgressUpdate((e2) => {
          i2({ loaded: e2.totalBytesSent, total: e2.totalBytesExpectedToSend });
        });
      });
    }
    uploadFile({ filePath: e, cloudPath: t2, fileType: n2 = "image", onUploadProgress: s2 }) {
      if (!t2)
        throw new ne({ code: "CLOUDPATH_REQUIRED", message: "cloudPath不可为空" });
      let r2;
      return this.getOSSUploadOptionsFromPath({ cloudPath: t2 }).then((t3) => {
        const { url: i2, formData: o2, name: a2 } = t3.result;
        r2 = t3.result.fileUrl;
        const c2 = { url: i2, formData: o2, name: a2, filePath: e, fileType: n2 };
        return this.uploadFileToOSS(Object.assign({}, c2, { onUploadProgress: s2 }));
      }).then(() => this.reportOSSUpload({ cloudPath: t2 })).then((t3) => new Promise((n3, s3) => {
        t3.success ? n3({ success: true, filePath: e, fileID: r2 }) : s3(new ne({ code: "UPLOAD_FAILED", message: "文件上传失败" }));
      }));
    }
    deleteFile({ fileList: e }) {
      const t2 = { method: "serverless.file.resource.delete", params: JSON.stringify({ fileList: e }) };
      return this.request(this.setupRequest(t2)).then((e2) => {
        if (e2.success)
          return e2.result;
        throw new ne({ code: "DELETE_FILE_FAILED", message: "删除文件失败" });
      });
    }
    getTempFileURL({ fileList: e } = {}) {
      if (!Array.isArray(e) || 0 === e.length)
        throw new ne({ code: "INVALID_PARAM", message: "fileList的元素必须是非空的字符串" });
      const t2 = { method: "serverless.file.resource.getTempFileURL", params: JSON.stringify({ fileList: e }) };
      return this.request(this.setupRequest(t2)).then((e2) => {
        if (e2.success)
          return { fileList: e2.result.fileList.map((e3) => ({ fileID: e3.fileID, tempFileURL: e3.tempFileURL })) };
        throw new ne({ code: "GET_TEMP_FILE_URL_FAILED", message: "获取临时文件链接失败" });
      });
    }
  };
  var kt = { init(e) {
    const t2 = new bt(e), n2 = { signInAnonymously: function() {
      return t2.authorize();
    }, getLoginState: function() {
      return Promise.resolve(false);
    } };
    return t2.auth = function() {
      return n2;
    }, t2.customAuth = t2.auth, t2;
  } };
  function Ct({ data: e }) {
    let t2;
    t2 = le();
    const n2 = JSON.parse(JSON.stringify(e || {}));
    if (Object.assign(n2, { clientInfo: t2 }), !n2.uniIdToken) {
      const { token: e2 } = ie();
      e2 && (n2.uniIdToken = e2);
    }
    return n2;
  }
  async function Tt({ name: e, data: t2 } = {}) {
    await this.__dev__.initLocalNetwork();
    const { localAddress: n2, localPort: s2 } = this.__dev__, r2 = { aliyun: "aliyun", tencent: "tcb" }[this.config.provider], i2 = this.config.spaceId, o2 = `http://${n2}:${s2}/system/check-function`, a2 = `http://${n2}:${s2}/cloudfunctions/${e}`;
    return new Promise((t3, n3) => {
      se.request({ method: "POST", url: o2, data: { name: e, platform: P, provider: r2, spaceId: i2 }, timeout: 3e3, success(e2) {
        t3(e2);
      }, fail() {
        t3({ data: { code: "NETWORK_ERROR", message: "连接本地调试服务失败，请检查客户端是否和主机在同一局域网下，自动切换为已部署的云函数。" } });
      } });
    }).then(({ data: e2 } = {}) => {
      const { code: t3, message: n3 } = e2 || {};
      return { code: 0 === t3 ? 0 : t3 || "SYS_ERR", message: n3 || "SYS_ERR" };
    }).then(({ code: n3, message: s3 }) => {
      if (0 !== n3) {
        switch (n3) {
          case "MODULE_ENCRYPTED":
            console.error(`此云函数（${e}）依赖加密公共模块不可本地调试，自动切换为云端已部署的云函数`);
            break;
          case "FUNCTION_ENCRYPTED":
            console.error(`此云函数（${e}）已加密不可本地调试，自动切换为云端已部署的云函数`);
            break;
          case "ACTION_ENCRYPTED":
            console.error(s3 || "需要访问加密的uni-clientDB-action，自动切换为云端环境");
            break;
          case "NETWORK_ERROR": {
            const e2 = "连接本地调试服务失败，请检查客户端是否和主机在同一局域网下";
            throw console.error(e2), new Error(e2);
          }
          case "SWITCH_TO_CLOUD":
            break;
          default: {
            const e2 = `检测本地调试服务出现错误：${s3}，请检查网络环境或重启客户端再试`;
            throw console.error(e2), new Error(e2);
          }
        }
        return this._callCloudFunction({ name: e, data: t2 });
      }
      return new Promise((e2, n4) => {
        const s4 = Ct.call(this, { data: t2 });
        se.request({ method: "POST", url: a2, data: { provider: r2, platform: P, param: s4 }, success: ({ statusCode: t3, data: s5 } = {}) => !t3 || t3 >= 400 ? n4(new ne({ code: s5.code || "SYS_ERR", message: s5.message || "request:fail" })) : e2({ result: s5 }), fail(e3) {
          n4(new ne({ code: e3.code || e3.errCode || "SYS_ERR", message: e3.message || e3.errMsg || "request:fail" }));
        } });
      });
    });
  }
  const Pt = [{ rule: /fc_function_not_found|FUNCTION_NOT_FOUND/, content: "，云函数[{functionName}]在云端不存在，请检查此云函数名称是否正确以及该云函数是否已上传到服务空间", mode: "append" }];
  var At = /[\\^$.*+?()[\]{}|]/g, Et = RegExp(At.source);
  function Ot(e, t2, n2) {
    return e.replace(new RegExp((s2 = t2) && Et.test(s2) ? s2.replace(At, "\\$&") : s2, "g"), n2);
    var s2;
  }
  const Rt = "request", Ut = "response", Lt = "both";
  const yn = { code: 2e4, message: "System error" }, _n = { code: 20101, message: "Invalid client" };
  function In(e) {
    const { errSubject: t2, subject: n2, errCode: s2, errMsg: r2, code: i2, message: o2, cause: a2 } = e || {};
    return new ne({ subject: t2 || n2 || "uni-secure-network", code: s2 || i2 || yn.code, message: r2 || o2, cause: a2 });
  }
  let bn;
  function An({ secretType: e } = {}) {
    return e === Rt || e === Ut || e === Lt;
  }
  function En({ name: e, data: t2 = {} } = {}) {
    return "DCloud-clientDB" === e && "encryption" === t2.redirectTo && "getAppClientKey" === t2.action;
  }
  function On({ provider: e, spaceId: t2, functionName: n2 } = {}) {
    const { appId: s2, uniPlatform: r2, osName: i2 } = ue();
    let o2 = r2;
    "app" === r2 && (o2 = i2);
    const a2 = function({ provider: e2, spaceId: t3 } = {}) {
      const n3 = T;
      if (!n3)
        return {};
      e2 = function(e3) {
        return "tencent" === e3 ? "tcb" : e3;
      }(e2);
      const s3 = n3.find((n4) => n4.provider === e2 && n4.spaceId === t3);
      return s3 && s3.config;
    }({ provider: e, spaceId: t2 });
    if (!a2 || !a2.accessControl || !a2.accessControl.enable)
      return false;
    const c2 = a2.accessControl.function || {}, u2 = Object.keys(c2);
    if (0 === u2.length)
      return true;
    const h2 = function(e2, t3) {
      let n3, s3, r3;
      for (let i3 = 0; i3 < e2.length; i3++) {
        const o3 = e2[i3];
        o3 !== t3 ? "*" !== o3 ? o3.split(",").map((e3) => e3.trim()).indexOf(t3) > -1 && (s3 = o3) : r3 = o3 : n3 = o3;
      }
      return n3 || s3 || r3;
    }(u2, n2);
    if (!h2)
      return false;
    if ((c2[h2] || []).find((e2 = {}) => e2.appId === s2 && (e2.platform || "").toLowerCase() === o2.toLowerCase()))
      return true;
    throw console.error(`此应用[appId: ${s2}, platform: ${o2}]不在云端配置的允许访问的应用列表内，参考：https://uniapp.dcloud.net.cn/uniCloud/secure-network.html#verify-client`), In(_n);
  }
  function xn({ functionName: e, result: t2, logPvd: n2 }) {
    if (this.__dev__.debugLog && t2 && t2.requestId) {
      const s2 = JSON.stringify({ spaceId: this.config.spaceId, functionName: e, requestId: t2.requestId });
      console.log(`[${n2}-request]${s2}[/${n2}-request]`);
    }
  }
  function Rn(e) {
    const t2 = e.callFunction, n2 = function(n3) {
      const s2 = n3.name;
      n3.data = Ct.call(e, { data: n3.data });
      const r2 = { aliyun: "aliyun", tencent: "tcb", tcb: "tcb" }[this.config.provider], i2 = An(n3), o2 = En(n3), a2 = i2 || o2;
      return t2.call(this, n3).then((e2) => (e2.errCode = 0, !a2 && xn.call(this, { functionName: s2, result: e2, logPvd: r2 }), Promise.resolve(e2)), (e2) => (!a2 && xn.call(this, { functionName: s2, result: e2, logPvd: r2 }), e2 && e2.message && (e2.message = function({ message: e3 = "", extraInfo: t3 = {}, formatter: n4 = [] } = {}) {
        for (let s3 = 0; s3 < n4.length; s3++) {
          const { rule: r3, content: i3, mode: o3 } = n4[s3], a3 = e3.match(r3);
          if (!a3)
            continue;
          let c2 = i3;
          for (let e4 = 1; e4 < a3.length; e4++)
            c2 = Ot(c2, `{$${e4}}`, a3[e4]);
          for (const e4 in t3)
            c2 = Ot(c2, `{${e4}}`, t3[e4]);
          return "replace" === o3 ? c2 : e3 + c2;
        }
        return e3;
      }({ message: `[${n3.name}]: ${e2.message}`, formatter: Pt, extraInfo: { functionName: s2 } })), Promise.reject(e2)));
    };
    e.callFunction = function(t3) {
      const { provider: s2, spaceId: r2 } = e.config, i2 = t3.name;
      let o2, a2;
      if (t3.data = t3.data || {}, e.__dev__.debugInfo && !e.__dev__.debugInfo.forceRemote && E ? (e._callCloudFunction || (e._callCloudFunction = n2, e._callLocalFunction = Tt), o2 = Tt) : o2 = n2, o2 = o2.bind(e), En(t3))
        a2 = n2.call(e, t3);
      else if (An(t3)) {
        a2 = new bn({ secretType: t3.secretType, uniCloudIns: e }).wrapEncryptDataCallFunction(n2.bind(e))(t3);
      } else if (On({ provider: s2, spaceId: r2, functionName: i2 })) {
        a2 = new bn({ secretType: t3.secretType, uniCloudIns: e }).wrapVerifyClientCallFunction(n2.bind(e))(t3);
      } else
        a2 = o2(t3);
      return Object.defineProperty(a2, "result", { get: () => (console.warn("当前返回结果为Promise类型，不可直接访问其result属性，详情请参考：https://uniapp.dcloud.net.cn/uniCloud/faq?id=promise"), {}) }), a2;
    };
  }
  bn = class {
    constructor() {
      throw In({ message: `Platform ${P} is not enabled, please check whether secure network module is enabled in your manifest.json` });
    }
  };
  const Un = Symbol("CLIENT_DB_INTERNAL");
  function Ln(e, t2) {
    return e.then = "DoNotReturnProxyWithAFunctionNamedThen", e._internalType = Un, e.inspect = null, e.__v_raw = void 0, new Proxy(e, { get(e2, n2, s2) {
      if ("_uniClient" === n2)
        return null;
      if ("symbol" == typeof n2)
        return e2[n2];
      if (n2 in e2 || "string" != typeof n2) {
        const t3 = e2[n2];
        return "function" == typeof t3 ? t3.bind(e2) : t3;
      }
      return t2.get(e2, n2, s2);
    } });
  }
  function Nn(e) {
    return { on: (t2, n2) => {
      e[t2] = e[t2] || [], e[t2].indexOf(n2) > -1 || e[t2].push(n2);
    }, off: (t2, n2) => {
      e[t2] = e[t2] || [];
      const s2 = e[t2].indexOf(n2);
      -1 !== s2 && e[t2].splice(s2, 1);
    } };
  }
  const Dn = ["db.Geo", "db.command", "command.aggregate"];
  function Fn(e, t2) {
    return Dn.indexOf(`${e}.${t2}`) > -1;
  }
  function qn(e) {
    switch (g(e = re(e))) {
      case "array":
        return e.map((e2) => qn(e2));
      case "object":
        return e._internalType === Un || Object.keys(e).forEach((t2) => {
          e[t2] = qn(e[t2]);
        }), e;
      case "regexp":
        return { $regexp: { source: e.source, flags: e.flags } };
      case "date":
        return { $date: e.toISOString() };
      default:
        return e;
    }
  }
  function Mn(e) {
    return e && e.content && e.content.$method;
  }
  class Kn {
    constructor(e, t2, n2) {
      this.content = e, this.prevStage = t2 || null, this.udb = null, this._database = n2;
    }
    toJSON() {
      let e = this;
      const t2 = [e.content];
      for (; e.prevStage; )
        e = e.prevStage, t2.push(e.content);
      return { $db: t2.reverse().map((e2) => ({ $method: e2.$method, $param: qn(e2.$param) })) };
    }
    toString() {
      return JSON.stringify(this.toJSON());
    }
    getAction() {
      const e = this.toJSON().$db.find((e2) => "action" === e2.$method);
      return e && e.$param && e.$param[0];
    }
    getCommand() {
      return { $db: this.toJSON().$db.filter((e) => "action" !== e.$method) };
    }
    get isAggregate() {
      let e = this;
      for (; e; ) {
        const t2 = Mn(e), n2 = Mn(e.prevStage);
        if ("aggregate" === t2 && "collection" === n2 || "pipeline" === t2)
          return true;
        e = e.prevStage;
      }
      return false;
    }
    get isCommand() {
      let e = this;
      for (; e; ) {
        if ("command" === Mn(e))
          return true;
        e = e.prevStage;
      }
      return false;
    }
    get isAggregateCommand() {
      let e = this;
      for (; e; ) {
        const t2 = Mn(e), n2 = Mn(e.prevStage);
        if ("aggregate" === t2 && "command" === n2)
          return true;
        e = e.prevStage;
      }
      return false;
    }
    getNextStageFn(e) {
      const t2 = this;
      return function() {
        return jn({ $method: e, $param: qn(Array.from(arguments)) }, t2, t2._database);
      };
    }
    get count() {
      return this.isAggregate ? this.getNextStageFn("count") : function() {
        return this._send("count", Array.from(arguments));
      };
    }
    get remove() {
      return this.isCommand ? this.getNextStageFn("remove") : function() {
        return this._send("remove", Array.from(arguments));
      };
    }
    get() {
      return this._send("get", Array.from(arguments));
    }
    get add() {
      return this.isCommand ? this.getNextStageFn("add") : function() {
        return this._send("add", Array.from(arguments));
      };
    }
    update() {
      return this._send("update", Array.from(arguments));
    }
    end() {
      return this._send("end", Array.from(arguments));
    }
    get set() {
      return this.isCommand ? this.getNextStageFn("set") : function() {
        throw new Error("JQL禁止使用set方法");
      };
    }
    _send(e, t2) {
      const n2 = this.getAction(), s2 = this.getCommand();
      if (s2.$db.push({ $method: e, $param: qn(t2) }), b) {
        const e2 = s2.$db.find((e3) => "collection" === e3.$method), t3 = e2 && e2.$param;
        t3 && 1 === t3.length && "string" == typeof e2.$param[0] && e2.$param[0].indexOf(",") > -1 && console.warn("检测到使用JQL语法联表查询时，未使用getTemp先过滤主表数据，在主表数据量大的情况下可能会查询缓慢。\n- 如何优化请参考此文档：https://uniapp.dcloud.net.cn/uniCloud/jql?id=lookup-with-temp \n- 如果主表数据量很小请忽略此信息，项目发行时不会出现此提示。");
      }
      return this._database._callCloudFunction({ action: n2, command: s2 });
    }
  }
  function jn(e, t2, n2) {
    return Ln(new Kn(e, t2, n2), { get(e2, t3) {
      let s2 = "db";
      return e2 && e2.content && (s2 = e2.content.$method), Fn(s2, t3) ? jn({ $method: t3 }, e2, n2) : function() {
        return jn({ $method: t3, $param: qn(Array.from(arguments)) }, e2, n2);
      };
    } });
  }
  function Bn({ path: e, method: t2 }) {
    return class {
      constructor() {
        this.param = Array.from(arguments);
      }
      toJSON() {
        return { $newDb: [...e.map((e2) => ({ $method: e2 })), { $method: t2, $param: this.param }] };
      }
      toString() {
        return JSON.stringify(this.toJSON());
      }
    };
  }
  function $n(e, t2 = {}) {
    return Ln(new e(t2), { get: (e2, t3) => Fn("db", t3) ? jn({ $method: t3 }, null, e2) : function() {
      return jn({ $method: t3, $param: qn(Array.from(arguments)) }, null, e2);
    } });
  }
  class Wn extends class {
    constructor({ uniClient: e = {}, isJQL: t2 = false } = {}) {
      this._uniClient = e, this._authCallBacks = {}, this._dbCallBacks = {}, e._isDefault && (this._dbCallBacks = U("_globalUniCloudDatabaseCallback")), t2 || (this.auth = Nn(this._authCallBacks)), this._isJQL = t2, Object.assign(this, Nn(this._dbCallBacks)), this.env = Ln({}, { get: (e2, t3) => ({ $env: t3 }) }), this.Geo = Ln({}, { get: (e2, t3) => Bn({ path: ["Geo"], method: t3 }) }), this.serverDate = Bn({ path: [], method: "serverDate" }), this.RegExp = Bn({ path: [], method: "RegExp" });
    }
    getCloudEnv(e) {
      if ("string" != typeof e || !e.trim())
        throw new Error("getCloudEnv参数错误");
      return { $env: e.replace("$cloudEnv_", "") };
    }
    _callback(e, t2) {
      const n2 = this._dbCallBacks;
      n2[e] && n2[e].forEach((e2) => {
        e2(...t2);
      });
    }
    _callbackAuth(e, t2) {
      const n2 = this._authCallBacks;
      n2[e] && n2[e].forEach((e2) => {
        e2(...t2);
      });
    }
    multiSend() {
      const e = Array.from(arguments), t2 = e.map((e2) => {
        const t3 = e2.getAction(), n2 = e2.getCommand();
        if ("getTemp" !== n2.$db[n2.$db.length - 1].$method)
          throw new Error("multiSend只支持子命令内使用getTemp");
        return { action: t3, command: n2 };
      });
      return this._callCloudFunction({ multiCommand: t2, queryList: e });
    }
  } {
    _parseResult(e) {
      return this._isJQL ? e.result : e;
    }
    _callCloudFunction({ action: e, command: t2, multiCommand: n2, queryList: s2 }) {
      function r2(e2, t3) {
        if (n2 && s2)
          for (let n3 = 0; n3 < s2.length; n3++) {
            const r3 = s2[n3];
            r3.udb && "function" == typeof r3.udb.setResult && (t3 ? r3.udb.setResult(t3) : r3.udb.setResult(e2.result.dataList[n3]));
          }
      }
      const i2 = this, o2 = this._isJQL ? "databaseForJQL" : "database";
      function a2(e2) {
        return i2._callback("error", [e2]), q(M(o2, "fail"), e2).then(() => q(M(o2, "complete"), e2)).then(() => (r2(null, e2), Y(B, { type: z, content: e2 }), Promise.reject(e2)));
      }
      const c2 = q(M(o2, "invoke")), u2 = this._uniClient;
      return c2.then(() => u2.callFunction({ name: "DCloud-clientDB", type: l, data: { action: e, command: t2, multiCommand: n2 } })).then((e2) => {
        const { code: t3, message: n3, token: s3, tokenExpired: c3, systemInfo: u3 = [] } = e2.result;
        if (u3)
          for (let e3 = 0; e3 < u3.length; e3++) {
            const { level: t4, message: n4, detail: s4 } = u3[e3], r3 = console["warn" === t4 ? "error" : t4] || console.log;
            let i3 = "[System Info]" + n4;
            s4 && (i3 = `${i3}
详细信息：${s4}`), r3(i3);
          }
        if (t3) {
          return a2(new ne({ code: t3, message: n3, requestId: e2.requestId }));
        }
        e2.result.errCode = e2.result.errCode || e2.result.code, e2.result.errMsg = e2.result.errMsg || e2.result.message, s3 && c3 && (oe({ token: s3, tokenExpired: c3 }), this._callbackAuth("refreshToken", [{ token: s3, tokenExpired: c3 }]), this._callback("refreshToken", [{ token: s3, tokenExpired: c3 }]), Y(W, { token: s3, tokenExpired: c3 }));
        const h2 = [{ prop: "affectedDocs", tips: "affectedDocs不再推荐使用，请使用inserted/deleted/updated/data.length替代" }, { prop: "code", tips: "code不再推荐使用，请使用errCode替代" }, { prop: "message", tips: "message不再推荐使用，请使用errMsg替代" }];
        for (let t4 = 0; t4 < h2.length; t4++) {
          const { prop: n4, tips: s4 } = h2[t4];
          if (n4 in e2.result) {
            const t5 = e2.result[n4];
            Object.defineProperty(e2.result, n4, { get: () => (console.warn(s4), t5) });
          }
        }
        return function(e3) {
          return q(M(o2, "success"), e3).then(() => q(M(o2, "complete"), e3)).then(() => {
            r2(e3, null);
            const t4 = i2._parseResult(e3);
            return Y(B, { type: z, content: t4 }), Promise.resolve(t4);
          });
        }(e2);
      }, (e2) => {
        /fc_function_not_found|FUNCTION_NOT_FOUND/g.test(e2.message) && console.warn("clientDB未初始化，请在web控制台保存一次schema以开启clientDB");
        return a2(new ne({ code: e2.code || "SYSTEM_ERROR", message: e2.message, requestId: e2.requestId }));
      });
    }
  }
  const zn = "token无效，跳转登录页面", Jn = "token过期，跳转登录页面", Hn = { TOKEN_INVALID_TOKEN_EXPIRED: Jn, TOKEN_INVALID_INVALID_CLIENTID: zn, TOKEN_INVALID: zn, TOKEN_INVALID_WRONG_TOKEN: zn, TOKEN_INVALID_ANONYMOUS_USER: zn }, Gn = { "uni-id-token-expired": Jn, "uni-id-check-token-failed": zn, "uni-id-token-not-exist": zn, "uni-id-check-device-feature-failed": zn };
  function Vn(e, t2) {
    let n2 = "";
    return n2 = e ? `${e}/${t2}` : t2, n2.replace(/^\//, "");
  }
  function Qn(e = [], t2 = "") {
    const n2 = [], s2 = [];
    return e.forEach((e2) => {
      true === e2.needLogin ? n2.push(Vn(t2, e2.path)) : false === e2.needLogin && s2.push(Vn(t2, e2.path));
    }), { needLoginPage: n2, notNeedLoginPage: s2 };
  }
  function Yn(e) {
    return e.split("?")[0].replace(/^\//, "");
  }
  function Xn() {
    return function(e) {
      let t2 = e && e.$page && e.$page.fullPath || "";
      return t2 ? ("/" !== t2.charAt(0) && (t2 = "/" + t2), t2) : t2;
    }(function() {
      const e = getCurrentPages();
      return e[e.length - 1];
    }());
  }
  function Zn() {
    return Yn(Xn());
  }
  function es(e = "", t2 = {}) {
    if (!e)
      return false;
    if (!(t2 && t2.list && t2.list.length))
      return false;
    const n2 = t2.list, s2 = Yn(e);
    return n2.some((e2) => e2.pagePath === s2);
  }
  const ts = !!t.uniIdRouter;
  const { loginPage: ns, routerNeedLogin: ss, resToLogin: rs, needLoginPage: is, notNeedLoginPage: os, loginPageInTabBar: as } = function({ pages: e = [], subPackages: n2 = [], uniIdRouter: s2 = {}, tabBar: r2 = {} } = t) {
    const { loginPage: i2, needLogin: o2 = [], resToLogin: a2 = true } = s2, { needLoginPage: c2, notNeedLoginPage: u2 } = Qn(e), { needLoginPage: h2, notNeedLoginPage: l2 } = function(e2 = []) {
      const t2 = [], n3 = [];
      return e2.forEach((e3) => {
        const { root: s3, pages: r3 = [] } = e3, { needLoginPage: i3, notNeedLoginPage: o3 } = Qn(r3, s3);
        t2.push(...i3), n3.push(...o3);
      }), { needLoginPage: t2, notNeedLoginPage: n3 };
    }(n2);
    return { loginPage: i2, routerNeedLogin: o2, resToLogin: a2, needLoginPage: [...c2, ...h2], notNeedLoginPage: [...u2, ...l2], loginPageInTabBar: es(i2, r2) };
  }();
  if (is.indexOf(ns) > -1)
    throw new Error(`Login page [${ns}] should not be "needLogin", please check your pages.json`);
  function cs(e) {
    const t2 = Zn();
    if ("/" === e.charAt(0))
      return e;
    const [n2, s2] = e.split("?"), r2 = n2.replace(/^\//, "").split("/"), i2 = t2.split("/");
    i2.pop();
    for (let e2 = 0; e2 < r2.length; e2++) {
      const t3 = r2[e2];
      ".." === t3 ? i2.pop() : "." !== t3 && i2.push(t3);
    }
    return "" === i2[0] && i2.shift(), "/" + i2.join("/") + (s2 ? "?" + s2 : "");
  }
  function us(e) {
    const t2 = Yn(cs(e));
    return !(os.indexOf(t2) > -1) && (is.indexOf(t2) > -1 || ss.some((t3) => function(e2, t4) {
      return new RegExp(t4).test(e2);
    }(e, t3)));
  }
  function hs({ redirect: e }) {
    const t2 = Yn(e), n2 = Yn(ns);
    return Zn() !== n2 && t2 !== n2;
  }
  function ls({ api: e, redirect: t2 } = {}) {
    if (!t2 || !hs({ redirect: t2 }))
      return;
    const n2 = function(e2, t3) {
      return "/" !== e2.charAt(0) && (e2 = "/" + e2), t3 ? e2.indexOf("?") > -1 ? e2 + `&uniIdRedirectUrl=${encodeURIComponent(t3)}` : e2 + `?uniIdRedirectUrl=${encodeURIComponent(t3)}` : e2;
    }(ns, t2);
    as ? "navigateTo" !== e && "redirectTo" !== e || (e = "switchTab") : "switchTab" === e && (e = "navigateTo");
    const s2 = { navigateTo: uni.navigateTo, redirectTo: uni.redirectTo, switchTab: uni.switchTab, reLaunch: uni.reLaunch };
    setTimeout(() => {
      s2[e]({ url: n2 });
    });
  }
  function ds({ url: e } = {}) {
    const t2 = { abortLoginPageJump: false, autoToLoginPage: false }, n2 = function() {
      const { token: e2, tokenExpired: t3 } = ie();
      let n3;
      if (e2) {
        if (t3 < Date.now()) {
          const e3 = "uni-id-token-expired";
          n3 = { errCode: e3, errMsg: Gn[e3] };
        }
      } else {
        const e3 = "uni-id-check-token-failed";
        n3 = { errCode: e3, errMsg: Gn[e3] };
      }
      return n3;
    }();
    if (us(e) && n2) {
      n2.uniIdRedirectUrl = e;
      if (G($).length > 0)
        return setTimeout(() => {
          Y($, n2);
        }, 0), t2.abortLoginPageJump = true, t2;
      t2.autoToLoginPage = true;
    }
    return t2;
  }
  function ps() {
    !function() {
      const e2 = Xn(), { abortLoginPageJump: t2, autoToLoginPage: n2 } = ds({ url: e2 });
      t2 || n2 && ls({ api: "redirectTo", redirect: e2 });
    }();
    const e = ["navigateTo", "redirectTo", "reLaunch", "switchTab"];
    for (let t2 = 0; t2 < e.length; t2++) {
      const n2 = e[t2];
      uni.addInterceptor(n2, { invoke(e2) {
        const { abortLoginPageJump: t3, autoToLoginPage: s2 } = ds({ url: e2.url });
        return t3 ? e2 : s2 ? (ls({ api: n2, redirect: cs(e2.url) }), false) : e2;
      } });
    }
  }
  function fs() {
    this.onResponse((e) => {
      const { type: t2, content: n2 } = e;
      let s2 = false;
      switch (t2) {
        case "cloudobject":
          s2 = function(e2) {
            if ("object" != typeof e2)
              return false;
            const { errCode: t3 } = e2 || {};
            return t3 in Gn;
          }(n2);
          break;
        case "clientdb":
          s2 = function(e2) {
            if ("object" != typeof e2)
              return false;
            const { errCode: t3 } = e2 || {};
            return t3 in Hn;
          }(n2);
      }
      s2 && function(e2 = {}) {
        const t3 = G($);
        ee().then(() => {
          const n3 = Xn();
          if (n3 && hs({ redirect: n3 }))
            return t3.length > 0 ? Y($, Object.assign({ uniIdRedirectUrl: n3 }, e2)) : void (ns && ls({ api: "navigateTo", redirect: n3 }));
        });
      }(n2);
    });
  }
  function gs(e) {
    !function(e2) {
      e2.onResponse = function(e3) {
        V(B, e3);
      }, e2.offResponse = function(e3) {
        Q(B, e3);
      };
    }(e), function(e2) {
      e2.onNeedLogin = function(e3) {
        V($, e3);
      }, e2.offNeedLogin = function(e3) {
        Q($, e3);
      }, ts && (U("_globalUniCloudStatus").needLoginInit || (U("_globalUniCloudStatus").needLoginInit = true, ee().then(() => {
        ps.call(e2);
      }), rs && fs.call(e2)));
    }(e), function(e2) {
      e2.onRefreshToken = function(e3) {
        V(W, e3);
      }, e2.offRefreshToken = function(e3) {
        Q(W, e3);
      };
    }(e);
  }
  let ms;
  const ys = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", _s = /^(?:[A-Za-z\d+/]{4})*?(?:[A-Za-z\d+/]{2}(?:==)?|[A-Za-z\d+/]{3}=?)?$/;
  function ws() {
    const e = ie().token || "", t2 = e.split(".");
    if (!e || 3 !== t2.length)
      return { uid: null, role: [], permission: [], tokenExpired: 0 };
    let n2;
    try {
      n2 = JSON.parse((s2 = t2[1], decodeURIComponent(ms(s2).split("").map(function(e2) {
        return "%" + ("00" + e2.charCodeAt(0).toString(16)).slice(-2);
      }).join(""))));
    } catch (e2) {
      throw new Error("获取当前用户信息出错，详细错误信息为：" + e2.message);
    }
    var s2;
    return n2.tokenExpired = 1e3 * n2.exp, delete n2.exp, delete n2.iat, n2;
  }
  ms = "function" != typeof atob ? function(e) {
    if (e = String(e).replace(/[\t\n\f\r ]+/g, ""), !_s.test(e))
      throw new Error("Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.");
    var t2;
    e += "==".slice(2 - (3 & e.length));
    for (var n2, s2, r2 = "", i2 = 0; i2 < e.length; )
      t2 = ys.indexOf(e.charAt(i2++)) << 18 | ys.indexOf(e.charAt(i2++)) << 12 | (n2 = ys.indexOf(e.charAt(i2++))) << 6 | (s2 = ys.indexOf(e.charAt(i2++))), r2 += 64 === n2 ? String.fromCharCode(t2 >> 16 & 255) : 64 === s2 ? String.fromCharCode(t2 >> 16 & 255, t2 >> 8 & 255) : String.fromCharCode(t2 >> 16 & 255, t2 >> 8 & 255, 255 & t2);
    return r2;
  } : atob;
  var vs = s(function(e, t2) {
    Object.defineProperty(t2, "__esModule", { value: true });
    const n2 = "chooseAndUploadFile:ok", s2 = "chooseAndUploadFile:fail";
    function r2(e2, t3) {
      return e2.tempFiles.forEach((e3, n3) => {
        e3.name || (e3.name = e3.path.substring(e3.path.lastIndexOf("/") + 1)), t3 && (e3.fileType = t3), e3.cloudPath = Date.now() + "_" + n3 + e3.name.substring(e3.name.lastIndexOf("."));
      }), e2.tempFilePaths || (e2.tempFilePaths = e2.tempFiles.map((e3) => e3.path)), e2;
    }
    function i2(e2, t3, { onChooseFile: s3, onUploadProgress: r3 }) {
      return t3.then((e3) => {
        if (s3) {
          const t4 = s3(e3);
          if (void 0 !== t4)
            return Promise.resolve(t4).then((t5) => void 0 === t5 ? e3 : t5);
        }
        return e3;
      }).then((t4) => false === t4 ? { errMsg: n2, tempFilePaths: [], tempFiles: [] } : function(e3, t5, s4 = 5, r4) {
        (t5 = Object.assign({}, t5)).errMsg = n2;
        const i3 = t5.tempFiles, o2 = i3.length;
        let a2 = 0;
        return new Promise((n3) => {
          for (; a2 < s4; )
            c2();
          function c2() {
            const s5 = a2++;
            if (s5 >= o2)
              return void (!i3.find((e4) => !e4.url && !e4.errMsg) && n3(t5));
            const u2 = i3[s5];
            e3.uploadFile({ filePath: u2.path, cloudPath: u2.cloudPath, fileType: u2.fileType, onUploadProgress(e4) {
              e4.index = s5, e4.tempFile = u2, e4.tempFilePath = u2.path, r4 && r4(e4);
            } }).then((e4) => {
              u2.url = e4.fileID, s5 < o2 && c2();
            }).catch((e4) => {
              u2.errMsg = e4.errMsg || e4.message, s5 < o2 && c2();
            });
          }
        });
      }(e2, t4, 5, r3));
    }
    t2.initChooseAndUploadFile = function(e2) {
      return function(t3 = { type: "all" }) {
        return "image" === t3.type ? i2(e2, function(e3) {
          const { count: t4, sizeType: n3, sourceType: i3 = ["album", "camera"], extension: o2 } = e3;
          return new Promise((e4, a2) => {
            uni.chooseImage({ count: t4, sizeType: n3, sourceType: i3, extension: o2, success(t5) {
              e4(r2(t5, "image"));
            }, fail(e5) {
              a2({ errMsg: e5.errMsg.replace("chooseImage:fail", s2) });
            } });
          });
        }(t3), t3) : "video" === t3.type ? i2(e2, function(e3) {
          const { camera: t4, compressed: n3, maxDuration: i3, sourceType: o2 = ["album", "camera"], extension: a2 } = e3;
          return new Promise((e4, c2) => {
            uni.chooseVideo({ camera: t4, compressed: n3, maxDuration: i3, sourceType: o2, extension: a2, success(t5) {
              const { tempFilePath: n4, duration: s3, size: i4, height: o3, width: a3 } = t5;
              e4(r2({ errMsg: "chooseVideo:ok", tempFilePaths: [n4], tempFiles: [{ name: t5.tempFile && t5.tempFile.name || "", path: n4, size: i4, type: t5.tempFile && t5.tempFile.type || "", width: a3, height: o3, duration: s3, fileType: "video", cloudPath: "" }] }, "video"));
            }, fail(e5) {
              c2({ errMsg: e5.errMsg.replace("chooseVideo:fail", s2) });
            } });
          });
        }(t3), t3) : i2(e2, function(e3) {
          const { count: t4, extension: n3 } = e3;
          return new Promise((e4, i3) => {
            let o2 = uni.chooseFile;
            if ("undefined" != typeof wx && "function" == typeof wx.chooseMessageFile && (o2 = wx.chooseMessageFile), "function" != typeof o2)
              return i3({ errMsg: s2 + " 请指定 type 类型，该平台仅支持选择 image 或 video。" });
            o2({ type: "all", count: t4, extension: n3, success(t5) {
              e4(r2(t5));
            }, fail(e5) {
              i3({ errMsg: e5.errMsg.replace("chooseFile:fail", s2) });
            } });
          });
        }(t3), t3);
      };
    };
  }), Is = n(vs);
  const Ss = "manual";
  function bs(e) {
    return { props: { localdata: { type: Array, default: () => [] }, options: { type: [Object, Array], default: () => ({}) }, spaceInfo: { type: Object, default: () => ({}) }, collection: { type: [String, Array], default: "" }, action: { type: String, default: "" }, field: { type: String, default: "" }, orderby: { type: String, default: "" }, where: { type: [String, Object], default: "" }, pageData: { type: String, default: "add" }, pageCurrent: { type: Number, default: 1 }, pageSize: { type: Number, default: 20 }, getcount: { type: [Boolean, String], default: false }, gettree: { type: [Boolean, String], default: false }, gettreepath: { type: [Boolean, String], default: false }, startwith: { type: String, default: "" }, limitlevel: { type: Number, default: 10 }, groupby: { type: String, default: "" }, groupField: { type: String, default: "" }, distinct: { type: [Boolean, String], default: false }, foreignKey: { type: String, default: "" }, loadtime: { type: String, default: "auto" }, manual: { type: Boolean, default: false } }, data: () => ({ mixinDatacomLoading: false, mixinDatacomHasMore: false, mixinDatacomResData: [], mixinDatacomErrorMessage: "", mixinDatacomPage: {} }), created() {
      this.mixinDatacomPage = { current: this.pageCurrent, size: this.pageSize, count: 0 }, this.$watch(() => {
        var e2 = [];
        return ["pageCurrent", "pageSize", "localdata", "collection", "action", "field", "orderby", "where", "getont", "getcount", "gettree", "groupby", "groupField", "distinct"].forEach((t2) => {
          e2.push(this[t2]);
        }), e2;
      }, (e2, t2) => {
        if (this.loadtime === Ss)
          return;
        let n2 = false;
        const s2 = [];
        for (let r2 = 2; r2 < e2.length; r2++)
          e2[r2] !== t2[r2] && (s2.push(e2[r2]), n2 = true);
        e2[0] !== t2[0] && (this.mixinDatacomPage.current = this.pageCurrent), this.mixinDatacomPage.size = this.pageSize, this.onMixinDatacomPropsChange(n2, s2);
      });
    }, methods: { onMixinDatacomPropsChange(e2, t2) {
    }, mixinDatacomEasyGet({ getone: e2 = false, success: t2, fail: n2 } = {}) {
      this.mixinDatacomLoading || (this.mixinDatacomLoading = true, this.mixinDatacomErrorMessage = "", this.mixinDatacomGet().then((n3) => {
        this.mixinDatacomLoading = false;
        const { data: s2, count: r2 } = n3.result;
        this.getcount && (this.mixinDatacomPage.count = r2), this.mixinDatacomHasMore = s2.length < this.pageSize;
        const i2 = e2 ? s2.length ? s2[0] : void 0 : s2;
        this.mixinDatacomResData = i2, t2 && t2(i2);
      }).catch((e3) => {
        this.mixinDatacomLoading = false, this.mixinDatacomErrorMessage = e3, n2 && n2(e3);
      }));
    }, mixinDatacomGet(t2 = {}) {
      let n2 = e.database(this.spaceInfo);
      const s2 = t2.action || this.action;
      s2 && (n2 = n2.action(s2));
      const r2 = t2.collection || this.collection;
      n2 = Array.isArray(r2) ? n2.collection(...r2) : n2.collection(r2);
      const i2 = t2.where || this.where;
      i2 && Object.keys(i2).length && (n2 = n2.where(i2));
      const o2 = t2.field || this.field;
      o2 && (n2 = n2.field(o2));
      const a2 = t2.foreignKey || this.foreignKey;
      a2 && (n2 = n2.foreignKey(a2));
      const c2 = t2.groupby || this.groupby;
      c2 && (n2 = n2.groupBy(c2));
      const u2 = t2.groupField || this.groupField;
      u2 && (n2 = n2.groupField(u2));
      true === (void 0 !== t2.distinct ? t2.distinct : this.distinct) && (n2 = n2.distinct());
      const h2 = t2.orderby || this.orderby;
      h2 && (n2 = n2.orderBy(h2));
      const l2 = void 0 !== t2.pageCurrent ? t2.pageCurrent : this.mixinDatacomPage.current, d2 = void 0 !== t2.pageSize ? t2.pageSize : this.mixinDatacomPage.size, p2 = void 0 !== t2.getcount ? t2.getcount : this.getcount, f2 = void 0 !== t2.gettree ? t2.gettree : this.gettree, g2 = void 0 !== t2.gettreepath ? t2.gettreepath : this.gettreepath, m2 = { getCount: p2 }, y2 = { limitLevel: void 0 !== t2.limitlevel ? t2.limitlevel : this.limitlevel, startWith: void 0 !== t2.startwith ? t2.startwith : this.startwith };
      return f2 && (m2.getTree = y2), g2 && (m2.getTreePath = y2), n2 = n2.skip(d2 * (l2 - 1)).limit(d2).get(m2), n2;
    } } };
  }
  function ks(e) {
    return function(t2, n2 = {}) {
      n2 = function(e2, t3 = {}) {
        return e2.customUI = t3.customUI || e2.customUI, e2.parseSystemError = t3.parseSystemError || e2.parseSystemError, Object.assign(e2.loadingOptions, t3.loadingOptions), Object.assign(e2.errorOptions, t3.errorOptions), "object" == typeof t3.secretMethods && (e2.secretMethods = t3.secretMethods), e2;
      }({ customUI: false, loadingOptions: { title: "加载中...", mask: true }, errorOptions: { type: "modal", retry: false } }, n2);
      const { customUI: s2, loadingOptions: r2, errorOptions: i2, parseSystemError: o2 } = n2, a2 = !s2;
      return new Proxy({}, { get: (s3, c2) => function({ fn: e2, interceptorName: t3, getCallbackArgs: n3 } = {}) {
        return async function(...s4) {
          const r3 = n3 ? n3({ params: s4 }) : {};
          let i3, o3;
          try {
            return await q(M(t3, "invoke"), { ...r3 }), i3 = await e2(...s4), await q(M(t3, "success"), { ...r3, result: i3 }), i3;
          } catch (e3) {
            throw o3 = e3, await q(M(t3, "fail"), { ...r3, error: o3 }), o3;
          } finally {
            await q(M(t3, "complete"), o3 ? { ...r3, error: o3 } : { ...r3, result: i3 });
          }
        };
      }({ fn: async function s4(...u2) {
        let l2;
        a2 && uni.showLoading({ title: r2.title, mask: r2.mask });
        const d2 = { name: t2, type: h, data: { method: c2, params: u2 } };
        "object" == typeof n2.secretMethods && function(e2, t3) {
          const n3 = t3.data.method, s5 = e2.secretMethods || {}, r3 = s5[n3] || s5["*"];
          r3 && (t3.secretType = r3);
        }(n2, d2);
        let p2 = false;
        try {
          l2 = await e.callFunction(d2);
        } catch (e2) {
          p2 = true, l2 = { result: new ne(e2) };
        }
        const { errSubject: f2, errCode: g2, errMsg: m2, newToken: y2 } = l2.result || {};
        if (a2 && uni.hideLoading(), y2 && y2.token && y2.tokenExpired && (oe(y2), Y(W, { ...y2 })), g2) {
          let e2 = m2;
          if (p2 && o2) {
            e2 = (await o2({ objectName: t2, methodName: c2, params: u2, errSubject: f2, errCode: g2, errMsg: m2 })).errMsg || m2;
          }
          if (a2)
            if ("toast" === i2.type)
              uni.showToast({ title: e2, icon: "none" });
            else {
              if ("modal" !== i2.type)
                throw new Error(`Invalid errorOptions.type: ${i2.type}`);
              {
                const { confirm: t3 } = await async function({ title: e3, content: t4, showCancel: n4, cancelText: s5, confirmText: r3 } = {}) {
                  return new Promise((i3, o3) => {
                    uni.showModal({ title: e3, content: t4, showCancel: n4, cancelText: s5, confirmText: r3, success(e4) {
                      i3(e4);
                    }, fail() {
                      i3({ confirm: false, cancel: true });
                    } });
                  });
                }({ title: "提示", content: e2, showCancel: i2.retry, cancelText: "取消", confirmText: i2.retry ? "重试" : "确定" });
                if (i2.retry && t3)
                  return s4(...u2);
              }
            }
          const n3 = new ne({ subject: f2, code: g2, message: m2, requestId: l2.requestId });
          throw n3.detail = l2.result, Y(B, { type: H, content: n3 }), n3;
        }
        return Y(B, { type: H, content: l2.result }), l2.result;
      }, interceptorName: "callObject", getCallbackArgs: function({ params: e2 } = {}) {
        return { objectName: t2, methodName: c2, params: e2 };
      } }) });
    };
  }
  function Cs(e) {
    return U("_globalUniCloudSecureNetworkCache__{spaceId}".replace("{spaceId}", e.config.spaceId));
  }
  async function Ts({ openid: e, callLoginByWeixin: t2 = false } = {}) {
    Cs(this);
    throw new Error(`[SecureNetwork] API \`initSecureNetworkByWeixin\` is not supported on platform \`${P}\``);
  }
  async function Ps(e) {
    const t2 = Cs(this);
    return t2.initPromise || (t2.initPromise = Ts.call(this, e)), t2.initPromise;
  }
  function As(e) {
    return function({ openid: t2, callLoginByWeixin: n2 = false } = {}) {
      return Ps.call(e, { openid: t2, callLoginByWeixin: n2 });
    };
  }
  function Es(e) {
    const t2 = { getSystemInfo: uni.getSystemInfo, getPushClientId: uni.getPushClientId };
    return function(n2) {
      return new Promise((s2, r2) => {
        t2[e]({ ...n2, success(e2) {
          s2(e2);
        }, fail(e2) {
          r2(e2);
        } });
      });
    };
  }
  class Os extends class {
    constructor() {
      this._callback = {};
    }
    addListener(e, t2) {
      this._callback[e] || (this._callback[e] = []), this._callback[e].push(t2);
    }
    on(e, t2) {
      return this.addListener(e, t2);
    }
    removeListener(e, t2) {
      if (!t2)
        throw new Error('The "listener" argument must be of type function. Received undefined');
      const n2 = this._callback[e];
      if (!n2)
        return;
      const s2 = function(e2, t3) {
        for (let n3 = e2.length - 1; n3 >= 0; n3--)
          if (e2[n3] === t3)
            return n3;
        return -1;
      }(n2, t2);
      n2.splice(s2, 1);
    }
    off(e, t2) {
      return this.removeListener(e, t2);
    }
    removeAllListener(e) {
      delete this._callback[e];
    }
    emit(e, ...t2) {
      const n2 = this._callback[e];
      if (n2)
        for (let e2 = 0; e2 < n2.length; e2++)
          n2[e2](...t2);
    }
  } {
    constructor() {
      super(), this._uniPushMessageCallback = this._receivePushMessage.bind(this), this._currentMessageId = -1, this._payloadQueue = [];
    }
    init() {
      return Promise.all([Es("getSystemInfo")(), Es("getPushClientId")()]).then(([{ appId: e } = {}, { cid: t2 } = {}] = []) => {
        if (!e)
          throw new Error("Invalid appId, please check the manifest.json file");
        if (!t2)
          throw new Error("Invalid push client id");
        this._appId = e, this._pushClientId = t2, this._seqId = Date.now() + "-" + Math.floor(9e5 * Math.random() + 1e5), this.emit("open"), this._initMessageListener();
      }, (e) => {
        throw this.emit("error", e), this.close(), e;
      });
    }
    async open() {
      return this.init();
    }
    _isUniCloudSSE(e) {
      if ("receive" !== e.type)
        return false;
      const t2 = e && e.data && e.data.payload;
      return !(!t2 || "UNI_CLOUD_SSE" !== t2.channel || t2.seqId !== this._seqId);
    }
    _receivePushMessage(e) {
      if (!this._isUniCloudSSE(e))
        return;
      const t2 = e && e.data && e.data.payload, { action: n2, messageId: s2, message: r2 } = t2;
      this._payloadQueue.push({ action: n2, messageId: s2, message: r2 }), this._consumMessage();
    }
    _consumMessage() {
      for (; ; ) {
        const e = this._payloadQueue.find((e2) => e2.messageId === this._currentMessageId + 1);
        if (!e)
          break;
        this._currentMessageId++, this._parseMessagePayload(e);
      }
    }
    _parseMessagePayload(e) {
      const { action: t2, messageId: n2, message: s2 } = e;
      "end" === t2 ? this._end({ messageId: n2, message: s2 }) : "message" === t2 && this._appendMessage({ messageId: n2, message: s2 });
    }
    _appendMessage({ messageId: e, message: t2 } = {}) {
      this.emit("message", t2);
    }
    _end({ messageId: e, message: t2 } = {}) {
      this.emit("end", t2), this.close();
    }
    _initMessageListener() {
      uni.onPushMessage(this._uniPushMessageCallback);
    }
    _destroy() {
      uni.offPushMessage(this._uniPushMessageCallback);
    }
    toJSON() {
      return { appId: this._appId, pushClientId: this._pushClientId, seqId: this._seqId };
    }
    close() {
      this._destroy(), this.emit("close");
    }
  }
  async function xs(e, t2) {
    const n2 = `http://${e}:${t2}/system/ping`;
    try {
      const e2 = await (s2 = { url: n2, timeout: 500 }, new Promise((e3, t3) => {
        se.request({ ...s2, success(t4) {
          e3(t4);
        }, fail(e4) {
          t3(e4);
        } });
      }));
      return !(!e2.data || 0 !== e2.data.code);
    } catch (e2) {
      return false;
    }
    var s2;
  }
  async function Rs(e) {
    {
      const { osName: e2, osVersion: t3 } = ue();
      "ios" === e2 && function(e3) {
        if (!e3 || "string" != typeof e3)
          return 0;
        const t4 = e3.match(/^(\d+)./);
        return t4 && t4[1] ? parseInt(t4[1]) : 0;
      }(t3) >= 14 && console.warn("iOS 14及以上版本连接uniCloud本地调试服务需要允许客户端查找并连接到本地网络上的设备（仅开发模式生效，发行模式会连接uniCloud云端服务）");
    }
    const t2 = e.__dev__;
    if (!t2.debugInfo)
      return;
    const { address: n2, servePort: s2 } = t2.debugInfo, { address: r2 } = await async function(e2, t3) {
      let n3;
      for (let s3 = 0; s3 < e2.length; s3++) {
        const r3 = e2[s3];
        if (await xs(r3, t3)) {
          n3 = r3;
          break;
        }
      }
      return { address: n3, port: t3 };
    }(n2, s2);
    if (r2)
      return t2.localAddress = r2, void (t2.localPort = s2);
    const i2 = console["error"];
    let o2 = "";
    if ("remote" === t2.debugInfo.initialLaunchType ? (t2.debugInfo.forceRemote = true, o2 = "当前客户端和HBuilderX不在同一局域网下（或其他网络原因无法连接HBuilderX），uniCloud本地调试服务不对当前客户端生效。\n- 如果不使用uniCloud本地调试服务，请直接忽略此信息。\n- 如需使用uniCloud本地调试服务，请将客户端与主机连接到同一局域网下并重新运行到客户端。") : o2 = "无法连接uniCloud本地调试服务，请检查当前客户端是否与主机在同一局域网下。\n- 如需使用uniCloud本地调试服务，请将客户端与主机连接到同一局域网下并重新运行到客户端。", o2 += "\n- 如果在HBuilderX开启的状态下切换过网络环境，请重启HBuilderX后再试\n- 检查系统防火墙是否拦截了HBuilderX自带的nodejs\n- 检查是否错误的使用拦截器修改uni.request方法的参数", 0 === P.indexOf("mp-") && (o2 += "\n- 小程序中如何使用uniCloud，请参考：https://uniapp.dcloud.net.cn/uniCloud/publish.html#useinmp"), !t2.debugInfo.forceRemote)
      throw new Error(o2);
    i2(o2);
  }
  function Us(e) {
    e._initPromiseHub || (e._initPromiseHub = new I({ createPromise: function() {
      let t2 = Promise.resolve();
      var n2;
      n2 = 1, t2 = new Promise((e2) => {
        setTimeout(() => {
          e2();
        }, n2);
      });
      const s2 = e.auth();
      return t2.then(() => s2.getLoginState()).then((e2) => e2 ? Promise.resolve() : s2.signInAnonymously());
    } }));
  }
  const Ls = { tcb: St, tencent: St, aliyun: me, private: kt };
  let Ns = new class {
    init(e) {
      let t2 = {};
      const n2 = Ls[e.provider];
      if (!n2)
        throw new Error("未提供正确的provider参数");
      t2 = n2.init(e), function(e2) {
        const t3 = {};
        e2.__dev__ = t3, t3.debugLog = "app" === P;
        const n3 = A;
        n3 && !n3.code && (t3.debugInfo = n3);
        const s2 = new I({ createPromise: function() {
          return Rs(e2);
        } });
        t3.initLocalNetwork = function() {
          return s2.exec();
        };
      }(t2), Us(t2), Rn(t2), function(e2) {
        const t3 = e2.uploadFile;
        e2.uploadFile = function(e3) {
          return t3.call(this, e3);
        };
      }(t2), function(e2) {
        e2.database = function(t3) {
          if (t3 && Object.keys(t3).length > 0)
            return e2.init(t3).database();
          if (this._database)
            return this._database;
          const n3 = $n(Wn, { uniClient: e2 });
          return this._database = n3, n3;
        }, e2.databaseForJQL = function(t3) {
          if (t3 && Object.keys(t3).length > 0)
            return e2.init(t3).databaseForJQL();
          if (this._databaseForJQL)
            return this._databaseForJQL;
          const n3 = $n(Wn, { uniClient: e2, isJQL: true });
          return this._databaseForJQL = n3, n3;
        };
      }(t2), function(e2) {
        e2.getCurrentUserInfo = ws, e2.chooseAndUploadFile = Is.initChooseAndUploadFile(e2), Object.assign(e2, { get mixinDatacom() {
          return bs(e2);
        } }), e2.SSEChannel = Os, e2.initSecureNetworkByWeixin = As(e2), e2.importObject = ks(e2);
      }(t2);
      return ["callFunction", "uploadFile", "deleteFile", "getTempFileURL", "downloadFile", "chooseAndUploadFile"].forEach((e2) => {
        if (!t2[e2])
          return;
        const n3 = t2[e2];
        t2[e2] = function() {
          return n3.apply(t2, Array.from(arguments));
        }, t2[e2] = function(e3, t3) {
          return function(n4) {
            let s2 = false;
            if ("callFunction" === t3) {
              const e4 = n4 && n4.type || u;
              s2 = e4 !== u;
            }
            const r2 = "callFunction" === t3 && !s2, i2 = this._initPromiseHub.exec();
            n4 = n4 || {};
            const { success: o2, fail: a2, complete: c2 } = te(n4), h2 = i2.then(() => s2 ? Promise.resolve() : q(M(t3, "invoke"), n4)).then(() => e3.call(this, n4)).then((e4) => s2 ? Promise.resolve(e4) : q(M(t3, "success"), e4).then(() => q(M(t3, "complete"), e4)).then(() => (r2 && Y(B, { type: J, content: e4 }), Promise.resolve(e4))), (e4) => s2 ? Promise.reject(e4) : q(M(t3, "fail"), e4).then(() => q(M(t3, "complete"), e4)).then(() => (Y(B, { type: J, content: e4 }), Promise.reject(e4))));
            if (!(o2 || a2 || c2))
              return h2;
            h2.then((e4) => {
              o2 && o2(e4), c2 && c2(e4), r2 && Y(B, { type: J, content: e4 });
            }, (e4) => {
              a2 && a2(e4), c2 && c2(e4), r2 && Y(B, { type: J, content: e4 });
            });
          };
        }(t2[e2], e2).bind(t2);
      }), t2.init = this.init, t2;
    }
  }();
  (() => {
    const e = E;
    let t2 = {};
    if (e && 1 === e.length)
      t2 = e[0], Ns = Ns.init(t2), Ns._isDefault = true;
    else {
      const t3 = ["auth", "callFunction", "uploadFile", "deleteFile", "getTempFileURL", "downloadFile", "database", "getCurrentUSerInfo", "importObject"];
      let n2;
      n2 = e && e.length > 0 ? "应用有多个服务空间，请通过uniCloud.init方法指定要使用的服务空间" : "应用未关联服务空间，请在uniCloud目录右键关联服务空间", t3.forEach((e2) => {
        Ns[e2] = function() {
          return console.error(n2), Promise.reject(new ne({ code: "SYS_ERR", message: n2 }));
        };
      });
    }
    Object.assign(Ns, { get mixinDatacom() {
      return bs(Ns);
    } }), gs(Ns), Ns.addInterceptor = D, Ns.removeInterceptor = F, Ns.interceptObject = K;
  })();
  uni.$u.config.unit = "rpx";
  function createApp() {
    const app = vue.createVueApp(App);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue, uni.VueShared);
