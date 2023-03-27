# chatgpt-plugins-playground
Multi-model and multi-vendor playground for developing ChatGPT plugins (and other LLMs) 

<img width="1164" alt="image" src="https://user-images.githubusercontent.com/246724/228085849-b3cdf285-3414-4f75-9e86-6620bb863d55.png">

## Features:
- 🌟 Plugins: Support AI plugins, discover and use public publics and develop locally your new plugin! 
- BYOK: Bring-your-own-key. Soon: Use API-keys from multiple vendors.
- Privacy: All logic and network requests are on client-side, including usage of your API keys.
- Local Persistance: Messages and settings are saved in locally on your device's LocalStorage

## Caveats:
1. Plugins support in Langchain is still experimental, buggy and slow
1. Langchain doesn't support client-side processing, so api keys has to be sent and handled on a backend.
1. Limited to a single plugin at a time.

## Develop
### Setup
1. Clone locally
1. Run `$ yarn install`

### Start web:
1. Run `$ yarn watch`
2. Open browser on `http://0.0.0.0:3010/`

### Optional: Start plugin-executer service:
1. Run `$ cd functions && yarn serve`
2. Set in your browser devtools `localStorage.isLocal = true`, to let the FE request your local function.

## Contribute

Contributions welcome! Read the [contribution guidelines](CONTRIBUTING.md) first and submit a Pull Request after Fork this repository.

## Contact
Please use GitHub [Issues](https://github.com/Feedox/chatgpt-plugins-playground/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc) to contact us.

