/**
  * pano720 main script
  * @description: 主入口脚本
  * @author: rexhang
  * @email: rexhang@outlook.com
  * @date: 2024-03-20 11:11:11
  * @version: v0.0.1
**/

// 可直接读取配置文件，也可fetch请求json文件，方便动态配置内容
// import conf from './conf/conf.json';

// 组件文件
import { Viewer, utils } from '@photo-sphere-viewer/core';
// import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin'; // 需要import插件先.
import { CompassPlugin } from '@photo-sphere-viewer/compass-plugin';
import { GyroscopePlugin } from '@photo-sphere-viewer/gyroscope-plugin';
import { SettingsPlugin } from '@photo-sphere-viewer/settings-plugin';
import { ResolutionPlugin } from '@photo-sphere-viewer/resolution-plugin';

// 样式文件
import '@photo-sphere-viewer/core/index.css'
import '@photo-sphere-viewer/compass-plugin/index.css'
import '@photo-sphere-viewer/settings-plugin/index.css'
import './css/index.css'

// 更改id=不符合规定范围内的id 重定向到某个id
function replaceQueryParamAndReload(param, newValue) {
  // 创建当前URL的URL对象
  const currentUrl = new URL(window.location);
  // 使用URLSearchParams来解析和修改查询字符串
  currentUrl.searchParams.set(param, newValue);
  // 设置修改后的URL，触发页面重载
  // window.location.href = currentUrl.toString();
  window.location.replace(currentUrl.toString());
}
replaceQueryParamAndReload.defaultID = '1'; // 挂载一个默认定向ID值

async function launchPage() {
  try {
    const urlSearchParams = new URLSearchParams(location.search);

    const pageId = urlSearchParams.get('id');

    if (!pageId) {
      return replaceQueryParamAndReload('id', replaceQueryParamAndReload.defaultID); // 不存id，前往兜底。
    }

    // http: 读取配置文件(方便后续更改配置，而不需要单独打包项目)
    const response = await fetch('./conf/conf.json');
    // 检查响应是否成功
    if (!response.ok) {
      throw new Error('网络响应错误');
    }
    // 等待解析JSON
    const data = await response.json();

    const { source: conf, defaultResolution } = data || {}; // 读取配置内容

    // 配置信息: conf.name 尽量不要超过10个字符
    let PANO_CONF = {};

    for (let i in (conf || {})) {
      const { name, dir, dirSmall } = conf[i];
      PANO_CONF[i] = {
        name: name,
        dir: require(`@img/${dir}`),
        dirSmall: require(`@img/${dirSmall}`),
      };
    }

    const CURRENT_PANO_CONF = PANO_CONF[pageId];

    if (!CURRENT_PANO_CONF) {
      return replaceQueryParamAndReload('id', replaceQueryParamAndReload.defaultID); // 不存在的id，前往兜底。
    }

    document.title = `全景照片预览 | ${CURRENT_PANO_CONF.name}`;

    const animatedValues = {
      pitch: { start: -Math.PI / 2, end: 0 },
      yaw: { start: Math.PI / 2, end: 0 },
      zoom: { start: 0, end: 50 },
      maxFov: { start: 130, end: 90 },
      fisheye: { start: 2, end: 0 },
    };

    const viewer = new Viewer({
      container: 'viewer',
      // panorama: CURRENT_PANO_CONF.dir, // 使用了 ResolutionPlugin 插件可以不写此字段
      // caption: CURRENT_PANO_CONF.name + '<b style="font-size: 10px;">power by @rexhang.airport</b>',
      caption: '<b style="font-size: 10px;">author@rexhang.airport</b>',
      // loading图
      loadingImg: require('@img/rexhang-icon.png'),
      defaultPitch: animatedValues.pitch.start,
      defaultYaw: animatedValues.yaw.start,
      defaultZoomLvl: animatedValues.zoom.start,
      maxFov: animatedValues.maxFov.start,
      fisheye: animatedValues.fisheye.start,
      mousemove: false,
      mousewheel: false,
      lang: {
        resolution: '清晰度',
      },
      navbar: [
        // 'autorotate',
        // 'zoom',
        // {
        //   title: 'Rerun animation',
        //   content: '🔄',
        //   onClick: reset,
        // },

        // 标题
        'caption',
        // 陀螺仪
        'gyroscope',
        // 设置
        'settings',
        // 全屏
        'fullscreen',
      ],
      plugins: [
        // 设置插件
        SettingsPlugin,
        // 解析度预加载插件
        [ResolutionPlugin, {
          defaultResolution: defaultResolution || 'SD',
          resolutions: [
            {
              id: 'SD',
              label: '普清',
              panorama: CURRENT_PANO_CONF.dirSmall,
            },
            {
              id: 'HD',
              label: '高清',
              panorama: CURRENT_PANO_CONF.dir,
            },
          ],
        }],
        // 陀螺仪插件
        [GyroscopePlugin, {
          absolutePosition: false,
          roll: true,
          moveMode: 'fast', // 'smooth'
          touchmove: true,
        }],
        // 自动旋转插件
        /* [AutorotatePlugin, {
          autostartDelay: null,
          autostartOnIdle: false,
          autorotatePitch: 0,
        }], */
        // 指南针插件
        [CompassPlugin, {
          size: '60px',
          // coneColor: 'rgba(255, 255, 255, 0.5)', // 非触摸时候的扇区颜色
          // hotspotColor: 'rgba(255, 255, 255, 0.5)', 方位点的颜色
          // navigationColor: 'rgba(255, 0, 0, 0.2)', // 触摸时候的扇区颜色
          hotspots: [
              { yaw: '0deg' },
              { yaw: '90deg' },
              { yaw: '180deg' },
              { yaw: '270deg' },
          ],
        }],
      ],
    });

    // const autorotate = viewer.getPlugin(AutorotatePlugin);

    let isInit = true;

    const delayStart = 254; // 延迟时间ms

    // setup timer for automatic animation on startup
    viewer.addEventListener('ready', () => {
      viewer.navbar.hide();
      if (delayStart) {
        setTimeout(() => {
          if (isInit) {
            intro(animatedValues.pitch.end, animatedValues.pitch.end);
          }
        }, delayStart);
      } else {
        if (isInit) {
          intro(animatedValues.pitch.end, animatedValues.pitch.end);
        }
      }
    }, { once: true });

    // launch animation to clicked point
    viewer.addEventListener('click', ({ data }) => {
      if (isInit) {
        intro(data.pitch, data.yaw);
      }
    });

    // perform the intro animation
    function intro(pitch, yaw) {
      isInit = false;
      // autorotate.stop();
      viewer.navbar.hide();

      new utils.Animation({
        properties: {
          ...animatedValues,
          pitch: { start: animatedValues.pitch.start, end: pitch },
          yaw: { start: animatedValues.yaw.start, end: yaw },
        },
        duration: 2500,
        easing: 'inOutQuad',
        onTick: (properties) => {
          viewer.setOptions({
            fisheye: properties.fisheye,
            maxFov: properties.maxFov,
          });
          viewer.rotate({ yaw: properties.yaw, pitch: properties.pitch });
          viewer.zoom(properties.zoom);
        },
      }).then(() => {
        // autorotate.start();
        viewer.navbar.show();
        viewer.setOptions({
          mousemove: true,
          mousewheel: true,
        });
      });
    }

    // perform the reverse animation
    function reset() {
      isInit = true;
      // autorotate.stop();
      viewer.navbar.hide();
      viewer.setOptions({
        mousemove: false,
        mousewheel: false,
      });

      new utils.Animation({
        properties: {
          pitch: { start: viewer.getPosition().pitch, end: animatedValues.pitch.start },
          yaw: { start: viewer.getPosition().yaw, end: animatedValues.yaw.start },
          zoom: { start: viewer.getZoomLevel(), end: animatedValues.zoom.start },
          maxFov: { start: animatedValues.maxFov.end, end: animatedValues.maxFov.start },
          fisheye: { start: animatedValues.fisheye.end, end: animatedValues.fisheye.start },
        },
        duration: 1500,
        easing: 'inOutQuad',
        onTick: (properties) => {
          viewer.setOptions({
            fisheye: properties.fisheye,
            maxFov: properties.maxFov,
          });
          viewer.rotate({ yaw: properties.yaw, pitch: properties.pitch });
          viewer.zoom(properties.zoom);
        },
      });
    }

    window.viewer = viewer;
  } catch (error) {
    // 处理错误
    alert('请求配置失败，请检查');
    console.error('请求配置失败，请检查 ', error);
  }
}

let pageLaunched = false; // 页面初始化状态标记 为了避免事件交集，所以在确保执行事件之前立刻更改状态
const debugDom = document.getElementById(window.debugMode.id);
// 当debug模式下 脚本未执行成功|失败的时候 需要进行脚本的监听
if (window.debugMode.status && ![true, false].includes(window.debugMode.loaded)) {
  // 由于load、error事件 并非互斥 所以需要随时监听状态 确保只初始化一次
  debugDom.addEventListener('load', () => {
    if (!pageLaunched) { pageLaunched = true; launchPage(); }
  }, false);
  debugDom.addEventListener('error', () => {
    if (!pageLaunched) { pageLaunched = true; launchPage(); }
  }, false);
  // 但是也有可能load、error事件一个都不触发，也需要兜底一下，顶多不加载debug脚本，但是不影响主要脚本内容的执行 超时时间为 1000ms
  setTimeout(() => {
    // 1s了还是没有执行 主要内容脚本的话 直接执行
    if (!pageLaunched) { pageLaunched = true; launchPage(); }
  }, 1000);
} else {
  pageLaunched = true;
  launchPage();
}

