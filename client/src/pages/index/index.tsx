import React, { Component } from "react";
import Taro from "@tarojs/taro";
import { View, Button, Picker } from "@tarojs/components";
import {
  AtCalendar,
  AtActivityIndicator,
  AtButton,
  AtTimeline,
  AtModal,
  AtModalContent,
  AtModalAction,
  AtInput,
  AtList,
  AtListItem,
  AtMessage,
  AtCheckbox
} from "taro-ui";
import "./index.scss";
import * as dayjs from "dayjs";

const pickers = ["110门", "220门", "350门"];

export default class Index extends Component {
  state = {
    loading: true,
    partLoading: true,
    openId: null,
    currentDate: dayjs(dayjs().format("YYYY-MM-DD")).valueOf(),
    addWorkModelShow: false,
    addWorkModelHide: true,
    work: {
      classify: "请选择分类",
      number: "",
      address: "",
      people: ""
    },
    list: [],
    month: [],
    marks: [],
    deleteWorkState: false,
    checkedList: []
  };

  componentWillMount() {}

  async componentDidMount() {
    Taro.getStorage({ key: "openId" })
      .then(res => {
        const openId = res.data;
        this.getWorks({ date: this.state.currentDate, openId });
        this.getMonthWorks({ date: this.state.currentDate, openId });
        this.setState({ loading: false, openId });
      })
      .catch(() => {
        Taro.cloud
          .callFunction({
            name: "login",
            data: {}
          })
          .then((res: { result: any }) => {
            if (res.result && res.result.openid) {
              const openId = res.result.openid;
              Taro.setStorage({ key: "openId", data: openId });
              this.getWorks({ date: this.state.currentDate, openId });
              this.getMonthWorks({ date: this.state.currentDate, openId });
              this.setState({ loading: false, openId });
            }
          });
      });
  }

  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  success = () => {
    this.componentDidMount();
  };

  onDayClick = item => {
    const number = dayjs(item.value).valueOf();
    this.setState({ currentDate: number, partLoading: true });
    this.getWorks({ date: number, openId: this.state.openId });
  };

  onMonthChange = value => {
    const number = dayjs(value).valueOf();
    this.setState({ currentDate: number, partLoading: true });
    this.getWorks({ date: number, openId: this.state.openId });
    this.getMonthWorks({ date: number, openId: this.state.openId });
  };

  getWorks = ({ date, openId }) => {
    Taro.cloud
      .callFunction({
        name: "getWork",
        data: {
          date,
          openId
        }
      })
      .then((res: { result: any }) => {
        if (res.result && res.result.data) {
          const _result = res.result.data || [];
          const result = _result.map(x => {
            return {
              title: `${x.address}, ${x.people}人，${x.price}门，${x.number}件`,
              icon: "check-circle",
              _id: x._id
            };
          });
          const numbers = [...res.result.data].reduce(
            (acc, cur) => acc + parseInt(cur.number),
            0
          );
          const prices = [...res.result.data].reduce((acc, cur) => {
            const price =
              (parseInt(cur.price) * parseInt(cur.number)) /
              parseInt(cur.people);
            return acc + price;
          }, 0);
          result.push({
            title: `${new Date(
              this.state.currentDate
            ).getDate()}日总计${numbers}件，${prices}元`,
            icon: "check-circle"
          });
          this.setState({ list: result, partLoading: false });
        }
      });
  };

  getMonthWorks = ({ date, openId }) => {
    const min = dayjs(date)
      .startOf("month")
      .valueOf();
    const max = dayjs(date)
      .endOf("month")
      .valueOf();
    Taro.cloud
      .callFunction({
        name: "getWorks",
        data: {
          min,
          max,
          openId
        }
      })
      .then((res: { result: any }) => {
        const numbers = [...res.result.data].reduce(
          (acc, cur) => acc + parseInt(cur.number),
          0
        );
        const prices = [...res.result.data].reduce((acc, cur) => {
          const price =
            (parseInt(cur.price) * parseInt(cur.number)) / parseInt(cur.people);
          return acc + price;
        }, 0);
        const marks = [...new Set([...res.result.data].map(x => x.date))].map(
          x => {
            return { value: x };
          }
        );
        this.setState({
          month: [
            { title: `本月总计${numbers}件，${prices}元`, icon: "sketch" }
          ],
          marks,
          partLoading: false
        });
      });
  };

  addWork = () => {
    this.setState({
      addWorkModelShow: true,
      addWorkModelHide: false,
      work: {
        classify: "请选择分类",
        number: "",
        address: "",
        people: ""
      }
    });
  };

  pickerChange = e => {
    this.setState({
      work: {
        ...this.state.work,
        classify: pickers[e.detail.value]
      }
    });
  };

  submit = () => {
    const work = { ...this.state.work };
    if (
      !work.classify ||
      work.classify === "请选择分类" ||
      !work.people ||
      !work.number ||
      !work.address ||
      Number.isNaN(parseInt(work.people)) ||
      Number.isNaN(parseInt(work.number))
    ) {
      Taro.atMessage({ message: "输入参数有误", type: "error" });
      return;
    }
    Taro.cloud
      .callFunction({
        name: "addWork",
        data: {
          date: this.state.currentDate,
          number: work.number,
          price: work.classify,
          openId: this.state.openId,
          address: work.address,
          people: work.people
        }
      })
      .then(res => {
        if (res.result) {
          this.close();
          this.getWorks({
            date: this.state.currentDate,
            openId: this.state.openId
          });
          this.getMonthWorks({
            date: this.state.currentDate,
            openId: this.state.openId
          });
        }
      });
  };

  close = () => {
    this.setState({ addWorkModelShow: false });
  };

  numberChange = value => {
    this.setState({ work: { ...this.state.work, number: value } });
  };

  peopleChange = value => {
    this.setState({ work: { ...this.state.work, people: value } });
  };

  addressChange = value => {
    this.setState({ work: { ...this.state.work, address: value } });
  };

  deleteWorks = () => {
    if (!this.state.checkedList || this.state.checkedList.length === 0) {
      Taro.atMessage({ message: "输入参数有误", type: "error" });
      return;
    }
    const dateIds = this.state.checkedList.map(x => x._id);
    Taro.cloud
      .callFunction({
        name: "deleteWorks",
        data: {
          ids: dateIds,
          openId: this.state.openId
        }
      })
      .then((res: { result: any }) => {
        if (res.result) {
          this.setState({ checkedList: [], deleteWorkState: false })
          this.onMonthChange(this.state.currentDate)
        }
       })
  };

  render() {
    return (
      <View className="home">
        {this.state.loading && (
          <AtActivityIndicator size={64} mode="center"></AtActivityIndicator>
        )}
        {!this.state.loading && (
          <View>
            <AtMessage />
            <AtCalendar
              currentDate={this.state.currentDate}
              marks={this.state.marks}
              onDayClick={this.onDayClick}
              isSwiper={false}
              onMonthChange={this.onMonthChange}
            />
            {this.state.partLoading ? (
              <View className="part-loading">
                <AtActivityIndicator></AtActivityIndicator>
              </View>
            ) : this.state.deleteWorkState ? (
              <View style={{ display: "block" }}>
                <AtCheckbox
                  options={[...this.state.list].slice(0, -1).map(x => {
                    return { value: x, label: x.title };
                  })}
                  selectedList={this.state.checkedList}
                  onChange={value => {
                    this.setState({
                      checkedList: value
                    });
                  }}
                />
                <AtButton
                  type="primary"
                  onClick={this.deleteWorks}
                  customStyle={{ margin: "8px 0" }}
                >
                  确认
                </AtButton>
                <AtButton
                  type="secondary"
                  onClick={() => {
                    this.setState({ checkedList: [], deleteWorkState: false });
                  }}
                >
                  取消
                </AtButton>
              </View>
            ) : (
              <View style={{ display: "block" }}>
                <AtTimeline
                  className="timeline"
                  items={this.state.list}
                ></AtTimeline>
                <AtTimeline
                  className="month-line"
                  items={this.state.month}
                ></AtTimeline>
                <AtButton
                  className="add-work"
                  onClick={this.addWork}
                  type="secondary"
                >
                  添加工时
                </AtButton>
                <AtButton
                  className="add-work danger"
                  onClick={() => {
                    this.setState({ deleteWorkState: true });
                  }}
                  type="secondary"
                  customStyle={{ margin: "10px 0 40px" }}
                >
                  删除工时
                </AtButton>
              </View>
            )}
            <AtModal
              className="add-work-modal"
              isOpened={this.state.addWorkModelShow}
            >
              <AtModalContent>
                <Picker
                  mode="selector"
                  range={pickers}
                  className={
                    this.state.work.classify === "请选择分类"
                      ? "picker-classify"
                      : ""
                  }
                  onChange={this.pickerChange}
                >
                  <AtList>
                    <AtListItem
                      title="分类"
                      extraText={this.state.work.classify}
                    />
                  </AtList>
                </Picker>
                {!this.state.addWorkModelHide && (
                  <View>
                    <AtInput
                      name="number"
                      title="个数"
                      type="number"
                      placeholder="总共个数"
                      value={this.state.work.number}
                      onChange={this.numberChange}
                    />
                    <AtInput
                      name="people"
                      title="人数"
                      type="number"
                      placeholder="总共人数"
                      value={this.state.work.people}
                      onChange={this.peopleChange}
                    />
                    <AtInput
                      name="address"
                      title="地址"
                      type="text"
                      placeholder="地址"
                      value={this.state.work.address}
                      onChange={this.addressChange}
                    />
                  </View>
                )}
              </AtModalContent>
              <AtModalAction>
                {" "}
                <Button onClick={this.close}>取消</Button>{" "}
                <Button onClick={this.submit}>确定</Button>{" "}
              </AtModalAction>
            </AtModal>
          </View>
        )}
      </View>
    );
  }
}