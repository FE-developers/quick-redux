import {getStore} from './createStore';

/***
 * dispatch封装
 */
const listenDispatch = function (methods) {
  Object.keys(methods).forEach(name => {
    const fn = methods[name];
    methods[name] = fn;
  });
  return methods;
};


const store = getStore();

/***
 * 修饰符
 */
export default function connect(mapState, mapDispatch) {

  // 初始状态
  const state = mapState ? mapState(store.getState()) : {};

  /***
   * 每次 dispatch
   * 都应该被处理
   */
  const methods = listenDispatch(mapDispatch ? mapDispatch(store.dispatch) : {});

  return function (conf) {

    function init(){
      const sub = () => {
        // 每次执行完成执行更新操作
        const newState = mapState ? mapState(store.getState()) : {};
        if (!newState) return;
        Object.keys(newState).forEach(name => {
          state[name] = newState[name];
          this[name] = state[name];
        });
      };
      // dispacth 订阅
      store.subscribe(() => {
        Promise.resolve().then(sub);
      });
      sub();
    }
    const computedConf = Object.assign({
      // dispatch注册
      ...methods,
      ...conf,
      // onInit onShow 任意执行一次
      onInit() {
        if(!this.__loading) {
          this.__loading = true;
          init.call(this,...arguments);
        }
        return conf.onInit && conf.onInit.call(this, ...arguments);
      },
      // onInit onShow 任意执行一次
      onShow() {
        if(!this.__loading) {
          this.__loading = true;
          init.call(this,...arguments);
        }
        return conf.onShow && conf.onShow.call(this, ...arguments);
      }
    });

    // 使用新特性
    if (computedConf.private) {
      computedConf.protected = {
        ...state,
        ...conf.private
      }
    } else {
      if (!conf.data) conf.data = {};
      computedConf.data = {
        ...state,
        ...conf.data
      }
    }

    return computedConf;
  }
}
