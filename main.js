import ElementUI from "element-ui"
import Vue from "vue"
import VueRouter from "vue-router"
import component from "../pages/{{component}}"

Vue.use(ElementUI)
Vue.use(VueRouter)
new Vue({
  el: "#app",
  render(createElement) {
    return createElement(component)
  }
})
