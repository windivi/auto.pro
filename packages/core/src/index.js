import { concat, iif, of, ReplaySubject, timer } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { isOpenForeground, isOpenStableMode, openForeground, openStableMode, requestFloatyPermission, requestServicePermission } from './permission';
import { initScreenSet } from './screen';
export * from './permission';
export * from './pausable';
export * from './screen';
export * from './store';
export * from './utils';
/**
 * 作业流
 */
export var effect$ = new ReplaySubject(1);
/**
 * 作业线程
 */
export var effectThread;
/**
 * 作业线程事件
 */
export var effectEvent;
/**
 * @param {CoreOption} param 初始化参数
 * @param {number | 1280} param.baseWidth 基准宽度，默认为1280
 * @param {number | 720} param.baseHeight 基准高度，默认为720
 * @param { false | '横屏' | '竖屏' | '自动'} param.needCap 是否需要截图功能，默认为false
 * @param {boolean | false} param.needService 是否需要无障碍服务，默认为false
 * @param {boolean | false} param.needFloaty 是否需要悬浮窗权限，默认为false
 * @param {boolean | false} param.needForeground 是否需要自动打开前台服务，默认为false
 */
export default function (_a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.baseWidth, baseWidth = _c === void 0 ? 1280 : _c, _d = _b.baseHeight, baseHeight = _d === void 0 ? 720 : _d, _e = _b.needCap, needCap = _e === void 0 ? false : _e, _f = _b.needService, needService = _f === void 0 ? false : _f, _g = _b.needFloaty, needFloaty = _g === void 0 ? false : _g, _h = _b.needForeground, needForeground = _h === void 0 ? false : _h, _j = _b.needStableMode, needStableMode = _j === void 0 ? false : _j;
    initScreenSet(baseWidth, baseHeight);
    effectThread = threads.start(function () {
        var thisThread = threads.currentThread();
        effectEvent = events.emitter(thisThread);
        var requestService$ = iif(function () { return needService; }, requestServicePermission(), of(true));
        var requestFloaty$ = iif(function () { return needFloaty; }, requestFloatyPermission(), of(true));
        var requestScreenCapture$ = timer(0);
        if (needCap) {
            if (images.requestScreenCapture({
                async: true,
                orientation: {
                    '横屏': 1,
                    '竖屏': 2,
                    '自动': 3,
                    'true': 3
                }[needCap]
            })) {
                requestScreenCapture$ = timer(500);
            }
            else {
                toastLog('请求截图权限失败');
                exit();
            }
        }
        if (needForeground && !isOpenForeground()) {
            openForeground();
        }
        if (needStableMode && !isOpenStableMode()) {
            openStableMode();
        }
        concat(requestService$, requestFloaty$, requestScreenCapture$).pipe(toArray()).subscribe({
            next: function () {
                effect$.next([thisThread, effectEvent]);
            },
            error: function (err) {
                toastLog(err);
                exit();
            }
        });
        setInterval(function () { }, 10000);
    });
    effectThread.waitFor();
}
