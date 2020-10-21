import React, { Component } from "react";
import Taro, { Config } from "@tarojs/taro";

import "./app.scss";

class App extends Component {
  state = {
    currentTab: 0
  };
  componentDidMount() {
    Taro.cloud.init();
    Taro.cloud
      .callFunction({
        name: "login",
        data: {}
      })
      .then(res => {
        if (res.result && res.result.openid) {
          Taro.setStorage({ key: "openId", data: res.result.openid });
        }
      });
  }

  componentDidShow() {
    const updateManager = Taro.getUpdateManager()
    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        updateManager.onUpdateReady(() => {
          Taro.showModal({
            title:'更新提示',
            content:'检测到新版本, 是否下载新版本并重启小程序?',
            success: (res) => {
              if (res.confirm) {
                updateManager.applyUpdate()
              }
            },
          })
        })
        updateManager.onUpdateFailed(() => {
          Taro.showModal({
            title:'已经有新版本了哟~',
            content:'新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~',
          })
        })
      }
    })
  }

  componentDidHide() {}

  componentDidCatchError() {}

  render() {
    return this.props.children;
  }
}

export default App;
