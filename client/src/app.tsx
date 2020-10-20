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

  componentDidShow() {}

  componentDidHide() {}

  componentDidCatchError() {}

  render() {
    return this.props.children;
  }
}

export default App;
