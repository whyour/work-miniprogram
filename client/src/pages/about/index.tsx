import React, { Component } from "react";
import Taro, { Config } from "@tarojs/taro";
import { View, Text } from "@tarojs/components";
import {
  AtAvatar,
  AtButton,
  AtActivityIndicator,
} from "taro-ui";
import "./index.scss";

export default class Index extends Component {
  state = {
    user: null,
    loading: true
  };
  componentWillMount() {}

  async componentDidMount() {
    this.setState({ loading: true });
    Taro.getStorage({ key: "user" })
      .then(res => {
        this.setState({ user: res.data, loading: false });
      })
      .catch(() => {
        this.setState({ user: null, loading: false });
      });
  }

  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  logout = () => {
    Taro.clearStorage();
    this.setState({ user: null });
    this.componentDidMount();
  };

  onGotUserInfo = res => {
    if (res.detail.userInfo) {
      Taro.setStorage({ key: "user", data: res.detail.userInfo });
      this.componentDidMount();
    }
  };

  render() {
    return (
      <View className="about">
        {this.state.loading && (
          <AtActivityIndicator size={64} mode="center"></AtActivityIndicator>
        )}
        {!this.state.loading && (
          <View className="about">
            {this.state.user && (
              <View className="me list-item">
                <AtAvatar circle image={this.state.user.avatarUrl}></AtAvatar>
                <View className="nick-name">{this.state.user.nickName}</View>
                <AtButton
                  type="secondary"
                  onClick={this.logout}
                  className="logout"
                  size="small"
                >
                  退出登录
                </AtButton>
              </View>
            )}
            {!this.state.user && (
              <View className="list-item">
                <AtButton
                  type="primary"
                  className="login-btn"
                  openType="getUserInfo"
                  onGetUserInfo={this.onGotUserInfo}
                >
                  微信登录
                </AtButton>
              </View>
            )}
          </View>
        )}
      </View>
    );
  }
}
