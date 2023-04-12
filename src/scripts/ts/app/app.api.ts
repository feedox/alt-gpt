import { Deferred, libx, LibxJS } from '/frame/scripts/ts/browserified/frame.js';
import { SSE } from '/scripts/ts/browserified/index.js';
import { Api as FrameApi } from 'frame.libx.js/build-web/scripts/ts/app/app.api.js';
import helpers from '/scripts/ts/app/app.helpers.js';

interface IDeferredWithProgress<T = any> extends Deferred<T> {
    progress: any;
}

export class Api extends FrameApi {
    test() {
        console.log('api test');
    }

    public getApiPrefix(isLocal?: boolean) {
        if (isLocal == null) {
            isLocal = libx.browser.helpers.getParameters()['local'] != null;
        }

        if (window.localStorage?.isLocal == 'true') {
            isLocal = true;
        }

        const isDev = window.projconfig.env == 'dev';

        if (!isLocal && isDev) return window.projconfig.apiUrlProd;

        console.warn('Using local env!');
        return window.projconfig.apiUrl;
        // projconfig
    }

    public stream(url: string, payload: Object, headers, callback: ({ id, data }) => {}, method = 'POST') {
        const p = libx.newPromise();
        var source = new SSE(url, {
            headers: {
                // 'Content-Type': 'plain/text',
                'Content-Type': 'application/json; charset=UTF-8',
                ...headers,
            }, payload: JSON.stringify({ ...payload }),
            method,
            withCredentials: false,
        });
        source.addEventListener('message', (message) => {
            if (message.data == "{}") return;
            callback(JSON.parse(message.data));
        });
        source.addEventListener('end', (message) => {
            p.resolve(JSON.parse(message.data))
        });
        source.addEventListener('error', (message) => {
            let payload = null;
            try {
                payload = JSON.parse(message.data);
                payload = libx.merge(payload, {
                    statusCode: message?.source?.xhr?.status,
                    statusText: message?.source?.xhr?.statusText
                });
            } catch (err) {
                libx.log.w('api:stream: Failed to parse message, using default...', err);
            }
            p.reject(payload)
        });
        // callback);
        // function(e) {
        //     // Assuming we receive JSON-encoded data payloads:
        //     var payload = JSON.parse(e.data);
        //     console.log(payload);
        // });
        // source.addEventListener('status', function(e) {
        //     console.log('System status is now: ' + e.data);
        // });
        // window.addEventListener("beforeunload", () => {
        //     if (source.readyState !== EventSource.CLOSED) {
        //       source.close();
        //     }
        // });

        source.stream();
        return p;
    }

    public override async showLogin(options: any = {}) {
        setTimeout(() => {
            const modal = app.layout.$buefy.modal.open({
                ...options,
                // parent: this,
                component: helpers.lazyLoader('/frame/views/misc/login.vue.js'),
                hasModalCard: true,
                trapFocus: true,
                props: {
                    caption: options?.caption,
                    providers: options?.providers,
                },
                events: {
                    loggedIn(value) {
                        console.log('loggedIn: ', value);
                        modal.close();
                    },
                },
            });

            const unwatch = app.layout.$watch('currentRoute', (v) => {
                unwatch();
                modal.close();
                // console.log('path changed');
            });
        }, options.delay ?? 0);
    }

    public async getStorageFileUrl(filename: string, isPool = false) {
        const userId = app.userManager.data.public.id;
        const file = (await this.listStorageFiles(`/user/${userId}/ai/input-files${isPool ? '-pool/' : '/'}`, null, isPool)).filter(x => x.name == filename)?.[0];
        if (file == null) return null;
        return await file.ref.getDownloadURL();

    }

    public fetch(url, withProxy = false) {
        const p = libx.newPromise();
        const fetcherUrl = `${this.getApiPrefix()}/fetcher/`;
        fetch(withProxy ? fetcherUrl + url : url)
            .then((response) => {
                const contentType = response.headers.get("content-type");
                const isJson = contentType && contentType.indexOf("application/json") !== -1;
                if (isJson) return response.json();
                else return response.text();
            })
            .then((data) => {
                p.resolve(data);
            })
            .catch((error) => {
                p.reject(error);
            });
        return p;
    }
}

// export const api = libx.merge(new Api(), frameApi);

export const api = new Api();
