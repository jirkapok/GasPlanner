## [0.16.1](https://github.com/jirkapok/GasPlanner/compare/v0.16.0...v0.16.1) (2026-10-23)


### Bug Fixes

* dashboard heat map not drawn after switching it on ([4d218b2](https://github.com/jirkapok/GasPlanner/commit/4d218b271ecbd5b5b901ba15855e754580b59aea))
* Fixed error while rendering heatmap in Diff page ([83ce9d7](https://github.com/jirkapok/GasPlanner/commit/83ce9d7637c5ea1a70b82391cd87b6e3b13e38bc))

# [0.16.0](https://github.com/jirkapok/GasPlanner/compare/v0.15.0...v0.16.0) (2026-10-23)


### Features

* [#114](https://github.com/jirkapok/GasPlanner/issues/114) Compare dives by end of profile ([#122](https://github.com/jirkapok/GasPlanner/issues/122)) ([4500403](https://github.com/jirkapok/GasPlanner/commit/45004037454d9e418b25103c437695393f5279be))

# [0.15.0](https://github.com/jirkapok/GasPlanner/compare/v0.14.0...v0.15.0) (2026-10-20)


### Features

* [#106](https://github.com/jirkapok/GasPlanner/issues/106) computer ascent speed ([06e5753](https://github.com/jirkapok/GasPlanner/commit/06e57532dafa25a5a489749c0085a984b98a25c0))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) computer high ascent speed warning ([3308757](https://github.com/jirkapok/GasPlanner/commit/3308757893fbaa0883612b82a92cb88732a6a127))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) computer tissues loading ([730836c](https://github.com/jirkapok/GasPlanner/commit/730836c14af28df413798e1c93c0432d4b78fb60))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) leading tissues loading from tissues sample ([90e8f1e](https://github.com/jirkapok/GasPlanner/commit/90e8f1e754e921d91c2e7e4ce498674ae66b08ce))


### Performance Improvements

* [#106](https://github.com/jirkapok/GasPlanner/issues/106) pass tissues history to computer without conversion ([8615e11](https://github.com/jirkapok/GasPlanner/commit/8615e11bdbbe3ae6f299af2f5948d1052ce43b28))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) transfer tissues history to workers packed in one array ([69584ce](https://github.com/jirkapok/GasPlanner/commit/69584ceb1e067aa2078154a48ae5ae3e0c7ffba7))

# [0.14.0](https://github.com/jirkapok/GasPlanner/compare/v0.13.1...v0.14.0) (2026-10-19)


### Bug Fixes

* [#106](https://github.com/jirkapok/GasPlanner/issues/106) dive computer points can be iterated repeatedly ([88539d2](https://github.com/jirkapok/GasPlanner/commit/88539d22c5812fc6ce83dbeaea29e3d25a9e9d88))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) exclude performance spec from interactive test run ([df359a7](https://github.com/jirkapok/GasPlanner/commit/df359a76885842be6f6e24dd9a6ed977bb6210e4))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) ignore events of cancelled computer worker ([6fa360e](https://github.com/jirkapok/GasPlanner/commit/6fa360ed7ce8923fd877816c2b3db5e56d97ce0a))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) require calculated dive data when updating dive results ([c2d8db6](https://github.com/jirkapok/GasPlanner/commit/c2d8db66803e345e64e8432d8b9501d7783014a4))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) restore ceilings transferred to computer worker ([67c7da3](https://github.com/jirkapok/GasPlanner/commit/67c7da300a7f2f4c65171980b0b9f5d5e61adb84))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) type dive computer points generator ([070c2fa](https://github.com/jirkapok/GasPlanner/commit/070c2fa43c6be66f6c81d843cf0e9118cd74e941))


### Features

* [#106](https://github.com/jirkapok/GasPlanner/issues/106) average depth for every second of the profile ([625047e](https://github.com/jirkapok/GasPlanner/commit/625047eb2da9db182f6c6c8592628139dafaf38b))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) calculate computer data in background worker ([1813bd4](https://github.com/jirkapok/GasPlanner/commit/1813bd43f4a25dc7ab53e7c7d621f8ae6723c1ad))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) computer events from dive results ([9d9f319](https://github.com/jirkapok/GasPlanner/commit/9d9f319e0fb4425a331889c0200e34581a60303a))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) computer next stop ([0d568f3](https://github.com/jirkapok/GasPlanner/commit/0d568f34965c2fc7ae1e18e59711e009c24df5e5))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) computer profile maximum and average depth ([ba31aec](https://github.com/jirkapok/GasPlanner/commit/ba31aecf4d1e90c9596ec6a664ecfef8839fd6d9))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) computer profile service for selected dive ([a3aa502](https://github.com/jirkapok/GasPlanner/commit/a3aa5028ef04f3add3d22074b602e6514bb9e2cc))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) computer stop events ([463d440](https://github.com/jirkapok/GasPlanner/commit/463d44003d4a3c759f6cab40e3b8e5fcbc276093))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) computer time to surface till end of the dive ([dd9265c](https://github.com/jirkapok/GasPlanner/commit/dd9265ccb21f476fcea6336564fe8960d45721ab))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) dive computer data of calculated dive in scuba-physics ([de24adf](https://github.com/jirkapok/GasPlanner/commit/de24adf52df13e87b608931f8e7f6767e4809ce3))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) keep calculated profile and all events of the dive ([96176a7](https://github.com/jirkapok/GasPlanner/commit/96176a7e17e76cf909023b30bc0843e1d4d12158))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) mandatory stop ends at the beginning of safety stop ([82617cf](https://github.com/jirkapok/GasPlanner/commit/82617cfae56f6d78224290f86216409abb4d5cdf))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) no decompression limit for every second of the dive ([8a25920](https://github.com/jirkapok/GasPlanner/commit/8a2592023586480d7581248485d55a0731ddc666))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) no decompression limits of calculated profile ([6847d7e](https://github.com/jirkapok/GasPlanner/commit/6847d7e8ccd763dfcd1421d8ff399ba6aeea27ef))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) profile chart average depth by library average depth ([dbac15e](https://github.com/jirkapok/GasPlanner/commit/dbac15e3b04b26b1a4b1cbab9458b825ddd38d12))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) report computer data and progress every 200 ms ([9c97c75](https://github.com/jirkapok/GasPlanner/commit/9c97c75c09a174b8290238957728c8f958af95e7))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) sample computer data in scuba-physics ([d79f8ea](https://github.com/jirkapok/GasPlanner/commit/d79f8ea0c8ff409ec678b728c26694e83ebb1255))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) sample computer profile for every second of the dive ([18995a8](https://github.com/jirkapok/GasPlanner/commit/18995a80b43a81a9109d170e93c5f0c5780d6384))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) stop is any flat segment with ceiling closer than stop distance ([340a989](https://github.com/jirkapok/GasPlanner/commit/340a98964da8eae484055e208c3a78c97220bf89))
* [#106](https://github.com/jirkapok/GasPlanner/issues/106) stream computer no decompression limit ([85af8c3](https://github.com/jirkapok/GasPlanner/commit/85af8c3d3df3b9f7aaccea00475981bcc3e27403))

## [0.13.1](https://github.com/jirkapok/GasPlanner/compare/v0.13.0...v0.13.1) (2026-10-17)


### Bug Fixes

* Fix sidebar preformatted overflow bug ([#121](https://github.com/jirkapok/GasPlanner/issues/121)) ([b0dfded](https://github.com/jirkapok/GasPlanner/commit/b0dfded70f9a21008e88836a443d2daf04a5254c))

# [0.13.0](https://github.com/jirkapok/GasPlanner/compare/v0.12.0...v0.13.0) (2026-10-15)


### Features

* [#36](https://github.com/jirkapok/GasPlanner/issues/36) identify mix in gas blender when only adding top mix ([#118](https://github.com/jirkapok/GasPlanner/issues/118)) ([af5273a](https://github.com/jirkapok/GasPlanner/commit/af5273a4d401136502a2223a9353d3c694480cbc))

# [0.12.0](https://github.com/jirkapok/GasPlanner/compare/v0.11.0...v0.12.0) (2026-10-14)


### Bug Fixes

* **planner:** [#26](https://github.com/jirkapok/GasPlanner/issues/26) mCCR options kept rendered like pSCR options ([5f17cf2](https://github.com/jirkapok/GasPlanner/commit/5f17cf21960fdbc314665fdf0f2e47247e30d7d3))


### Features

* **planner:** [#26](https://github.com/jirkapok/GasPlanner/issues/26) mCCR options and tanks preparation ([62e9145](https://github.com/jirkapok/GasPlanner/commit/62e9145676ab6a9b724ce50bdf34c9624d26a3ee))
* **planner:** [#26](https://github.com/jirkapok/GasPlanner/issues/26) mCCR tanks card and options components ([2214c30](https://github.com/jirkapok/GasPlanner/commit/2214c30e0c0c5b2e67ec6ef86b0e89ca2969d3c2))
* **planner:** [#26](https://github.com/jirkapok/GasPlanner/issues/26) mCCR url, validation and normalization ([e50a542](https://github.com/jirkapok/GasPlanner/commit/e50a54213e6c33d3dfd972ae4ad3fad45e290b88))
* **scuba-physics:** [#26](https://github.com/jirkapok/GasPlanner/issues/26) mCCR breathing model ([a52dc20](https://github.com/jirkapok/GasPlanner/commit/a52dc2017276a1a9351b3fc3291476aa35eb96f2))
* **scuba-physics:** [#26](https://github.com/jirkapok/GasPlanner/issues/26) mCCR oxygen and diluent consumption ([610a6e9](https://github.com/jirkapok/GasPlanner/commit/610a6e95022079a220feeee356db71c60add39b2))

# [0.11.0](https://github.com/jirkapok/GasPlanner/compare/v0.10.1...v0.11.0) (2026-10-14)


### Bug Fixes

* [#26](https://github.com/jirkapok/GasPlanner/issues/26) dives recalculated with invalid tanks or rebreather options ([ad22d63](https://github.com/jirkapok/GasPlanner/commit/ad22d638a9e68b5e613c93e246609b747c37776e))
* [#26](https://github.com/jirkapok/GasPlanner/issues/26) high ppO2 shown as error in dive issues ([896a5e4](https://github.com/jirkapok/GasPlanner/commit/896a5e4c25f3cb83997a60582528b9cf81b763e7))
* [#26](https://github.com/jirkapok/GasPlanner/issues/26) ignore redundant rebreather url values ([389ede3](https://github.com/jirkapok/GasPlanner/commit/389ede3fe44067b4ace0160ede0d6410d4ff3516))
* [#26](https://github.com/jirkapok/GasPlanner/issues/26) metabolic O2 input step by units rounding ([50e640a](https://github.com/jirkapok/GasPlanner/commit/50e640a71f149bfd4683fa5ae20a9c0589d66a15))
* [#26](https://github.com/jirkapok/GasPlanner/issues/26) stale rebreather form, unsupported circuits in url and imperial metabolic O2 range ([703eb82](https://github.com/jirkapok/GasPlanner/commit/703eb82e62dc6675eb4cbe2f2c1f33448ca74645))
* [#26](https://github.com/jirkapok/GasPlanner/issues/26) switch to simple view not saved to preferences ([698c095](https://github.com/jirkapok/GasPlanner/commit/698c095a43439a22708cfb660a989190f467703f))
* **scuba-physics:** [#26](https://github.com/jirkapok/GasPlanner/issues/26) emergency ascent breathes the loop until bailout ([b37d382](https://github.com/jirkapok/GasPlanner/commit/b37d382dc667b5afeb09d18e48023b307d82d0ba))


### Features

* [#26](https://github.com/jirkapok/GasPlanner/issues/26) calculate pSCR dives in planner workers ([cd47804](https://github.com/jirkapok/GasPlanner/commit/cd4780415f379a511f944d9fb97c9599c14cc9e4))
* [#26](https://github.com/jirkapok/GasPlanner/issues/26) error marks on tanks card tabs ([28754e0](https://github.com/jirkapok/GasPlanner/commit/28754e05a853cec31ce146ce2a932dc5f3923d94))
* [#26](https://github.com/jirkapok/GasPlanner/issues/26) metabolic O2 maximum 4 l/min ([6047e54](https://github.com/jirkapok/GasPlanner/commit/6047e549196b869afc573b66755f6a762785ffc0))
* [#26](https://github.com/jirkapok/GasPlanner/issues/26) rebreather type selection and pSCR options in tanks card ([92ab4a9](https://github.com/jirkapok/GasPlanner/commit/92ab4a93e1a163b8eba6c7b657b15f18c32e5dc2))
* [#26](https://github.com/jirkapok/GasPlanner/issues/26) rebreather url group, validation and saved settings ([d79e04d](https://github.com/jirkapok/GasPlanner/commit/d79e04d0de4871ce4bd92c30c7be9a8aff806db8))
* **scuba-physics:** [#26](https://github.com/jirkapok/GasPlanner/issues/26) consumption by gas uses breathing model ([4fe3f09](https://github.com/jirkapok/GasPlanner/commit/4fe3f091a98b8d9cea7652aeb9963fb96f89a705))
* **scuba-physics:** [#26](https://github.com/jirkapok/GasPlanner/issues/26) low ppO2 warning for hypoxic rebreather loop ([36b4fe9](https://github.com/jirkapok/GasPlanner/commit/36b4fe9d63e32b7eedc6c660490524929b0b9810))
* **scuba-physics:** [#26](https://github.com/jirkapok/GasPlanner/issues/26) pSCR breathing model ([c0b14af](https://github.com/jirkapok/GasPlanner/commit/c0b14afedfb400dd64f8c967c25c6b345f63ab3b))

## [0.10.1](https://github.com/jirkapok/GasPlanner/compare/v0.10.0...v0.10.1) (2026-10-13)


### Bug Fixes

* [#49](https://github.com/jirkapok/GasPlanner/issues/49) limit tank size to one decimal place ([#117](https://github.com/jirkapok/GasPlanner/issues/117)) ([81d997a](https://github.com/jirkapok/GasPlanner/commit/81d997ac350eb84083bd6024ed01fac8b61e9fa5))

# [0.10.0](https://github.com/jirkapok/GasPlanner/compare/v0.9.0...v0.10.0) (2026-10-04)


### Features

* [#108](https://github.com/jirkapok/GasPlanner/issues/108) Replace help popup by sidebar ([#113](https://github.com/jirkapok/GasPlanner/issues/113)) ([1b33b51](https://github.com/jirkapok/GasPlanner/commit/1b33b51430ca0c879e0ba9ed3393b4c019d91b89))

# [0.9.0](https://github.com/jirkapok/GasPlanner/compare/v0.8.2...v0.9.0) (2026-10-02)


### Features

* **scuba-physics:** [#26](https://github.com/jirkapok/GasPlanner/issues/26) breathing model abstraction ([e1fb290](https://github.com/jirkapok/GasPlanner/commit/e1fb2908b9770c1a0e980c965e14ce08247c3dca))
* **scuba-physics:** [#26](https://github.com/jirkapok/GasPlanner/issues/26) density and events by inspired gas, export breathing model ([3d79caf](https://github.com/jirkapok/GasPlanner/commit/3d79caf19d9d01ae5235acde8deae695260edd04))
* **scuba-physics:** [#26](https://github.com/jirkapok/GasPlanner/issues/26) generic rebreather formulas ([164bba7](https://github.com/jirkapok/GasPlanner/commit/164bba7594e4fc1cf14ec0f78136858cb66a94b4))
* **scuba-physics:** [#26](https://github.com/jirkapok/GasPlanner/issues/26) rebreather loop gas ([e497194](https://github.com/jirkapok/GasPlanner/commit/e497194a45f293b288651844d752b25c92a702bf))
* **scuba-physics:** [#26](https://github.com/jirkapok/GasPlanner/issues/26) rebreather options ([9da44b0](https://github.com/jirkapok/GasPlanner/commit/9da44b04b6c0758e5a6738f16b281053241c935d))

## [0.8.2](https://github.com/jirkapok/GasPlanner/compare/v0.8.1...v0.8.2) (2026-10-02)


### Bug Fixes

* [#22](https://github.com/jirkapok/GasPlanner/issues/22) alternate overlapping event labels in profile chart ([#111](https://github.com/jirkapok/GasPlanner/issues/111)) ([68a4ed5](https://github.com/jirkapok/GasPlanner/commit/68a4ed5d92549a596e82fa2bae01effbe5f2407f))

## [0.8.1](https://github.com/jirkapok/GasPlanner/compare/v0.8.0...v0.8.1) (2026-10-01)


### Bug Fixes

* components used isolated copies of shared services, losing settings, quiz progress and units ([22259a6](https://github.com/jirkapok/GasPlanner/commit/22259a6620be854d87c346b6ce55c5477549f48a))
* dive tabs title rounds depth and duration to one decimal ([de8e698](https://github.com/jirkapok/GasPlanner/commit/de8e69831627f40320768ca3215dc7bd74393cdf))

# [0.8.0](https://github.com/jirkapok/GasPlanner/compare/v0.7.1...v0.8.0) (2026-10-01)


### Features

* [#66](https://github.com/jirkapok/GasPlanner/issues/66) extend deepest segment by +5 m and/or +5 min ([02df52b](https://github.com/jirkapok/GasPlanner/commit/02df52bc34f5a7f47785017ac0cd9d9072eb8ca0))

## [0.7.1](https://github.com/jirkapok/GasPlanner/compare/v0.7.0...v0.7.1) (2026-09-30)


### Bug Fixes

* typo in compartment 4 and 5 ([#109](https://github.com/jirkapok/GasPlanner/issues/109)) ([4e1442d](https://github.com/jirkapok/GasPlanner/commit/4e1442d344b328cc1adf2197baa9d595b153236b))

# [0.7.0](https://github.com/jirkapok/GasPlanner/compare/v0.6.2...v0.7.0) (2026-09-30)


### Features

* [#25](https://github.com/jirkapok/GasPlanner/issues/25) consumed gas in liters per gas ([97afb8e](https://github.com/jirkapok/GasPlanner/commit/97afb8e52066fb4b84454448de9db7c1980a29f8))

## [0.6.2](https://github.com/jirkapok/GasPlanner/compare/v0.6.1...v0.6.2) (2026-09-26)


### Bug Fixes

* fixed build pipeline resolved previous version ([2f5d6d5](https://github.com/jirkapok/GasPlanner/commit/2f5d6d5721c31aa3160d1c61ca83dfed9c43554d))

## [0.6.1](https://github.com/jirkapok/GasPlanner/compare/v0.6.0...v0.6.1) (2026-09-26)


### Bug Fixes

* Fixed deployment of pwa inconsistent version numbers ([46524a5](https://github.com/jirkapok/GasPlanner/commit/46524a58d552b7b0d9e0db5165974db934b90e10))

# [0.6.0](https://github.com/jirkapok/GasPlanner/compare/v0.5.0...v0.6.0) (2026-09-26)


### Features

* [#45](https://github.com/jirkapok/GasPlanner/issues/45) round runtime at end of stops to minutes ([f2d415a](https://github.com/jirkapok/GasPlanner/commit/f2d415a48f137f6a2e59f09fb7757d2df0bf7fe1))

# [0.5.0](https://github.com/jirkapok/GasPlanner/compare/v0.4.2...v0.5.0) (2026-09-25)


### Features

* [#90](https://github.com/jirkapok/GasPlanner/issues/90) CNS residual between dives and 24 hour limit ([2229fc1](https://github.com/jirkapok/GasPlanner/commit/2229fc1e8b588aefccb737b8adfff8d8fc14cc19))

## [0.4.2](https://github.com/jirkapok/GasPlanner/compare/v0.4.1...v0.4.2) (2026-09-24)

## [0.4.1](https://github.com/jirkapok/GasPlanner/compare/v0.4.0...v0.4.1) (2026-09-24)


### Bug Fixes

* [#20](https://github.com/jirkapok/GasPlanner/issues/20) tabs overlap with menu at 780px viewport width ([99a10d7](https://github.com/jirkapok/GasPlanner/commit/99a10d7bcce5b18ca428e7f303278b4c1fa930e6))
* [#23](https://github.com/jirkapok/GasPlanner/issues/23) heatmap chart doesn't expand to full width on first load ([34686cf](https://github.com/jirkapok/GasPlanner/commit/34686cfe64eaed8626f3e9afecf4f0e98ceb370d))

# [0.4.0](https://github.com/jirkapok/GasPlanner/compare/v0.3.1...v0.4.0) (2026-09-24)


### Bug Fixes

* [#30](https://github.com/jirkapok/GasPlanner/issues/30) localize surface interval placeholder text ([1be7b6e](https://github.com/jirkapok/GasPlanner/commit/1be7b6e6a75d01fdfb87567aac0b45f865a79dc7))
* [#30](https://github.com/jirkapok/GasPlanner/issues/30) register the service worker so all languages work offline ([112fed6](https://github.com/jirkapok/GasPlanner/commit/112fed6640452d641dbfed28ee750363bdfe1d6b))
* [#30](https://github.com/jirkapok/GasPlanner/issues/30) show colored country flags in language dropdown ([232afac](https://github.com/jirkapok/GasPlanner/commit/232afac0552f82ba15ad0333386455970549a288))
* [#30](https://github.com/jirkapok/GasPlanner/issues/30) unsubscribe QuizService from onLangChange on destroy ([3bc41c1](https://github.com/jirkapok/GasPlanner/commit/3bc41c1bf039c8c640bafa019b807da2ba695961))
* [#30](https://github.com/jirkapok/GasPlanner/issues/30) update current quiz question text on language switch ([21fa560](https://github.com/jirkapok/GasPlanner/commit/21fa560419de42d94a411246bc6e3276058180d8))


### Features

* [#30](https://github.com/jirkapok/GasPlanner/issues/30) add runtime localization with language switcher ([a9954df](https://github.com/jirkapok/GasPlanner/commit/a9954df70c0f1c9e8f638948985644422c9bf709))
* [#30](https://github.com/jirkapok/GasPlanner/issues/30) localize all component templates for all languages ([d1a2bda](https://github.com/jirkapok/GasPlanner/commit/d1a2bda9c6d89ef9cbb0edba324df1626051642d))
* [#30](https://github.com/jirkapok/GasPlanner/issues/30) localize Plotly dive-profile charts ([cb2fe2e](https://github.com/jirkapok/GasPlanner/commit/cb2fe2e38c7dbbd19046216f77bd1d3069135ecd))
* [#30](https://github.com/jirkapok/GasPlanner/issues/30) localize the learn page and quiz questions ([76e62f3](https://github.com/jirkapok/GasPlanner/commit/76e62f34ff32990b9a5f67461992aceb7a666760))
* [#30](https://github.com/jirkapok/GasPlanner/issues/30) make number pipes locale-aware ([a352318](https://github.com/jirkapok/GasPlanner/commit/a352318339a414d17afe2328923163560710fda7))

## [0.3.1](https://github.com/jirkapok/GasPlanner/compare/v0.3.0...v0.3.1) (2026-09-23)

# [0.3.0](https://github.com/jirkapok/GasPlanner/compare/v0.2.0...v0.3.0) (2026-09-22)


### Features

* upgrade Angular to v21 ([536d6b2](https://github.com/jirkapok/GasPlanner/commit/536d6b2d2d1945f6759194f483ae7800080a9b2b))
* upgrade Angular to v22 ([9392f3a](https://github.com/jirkapok/GasPlanner/commit/9392f3a6063a1361bca15197ee1a9b16b1608f40))

# [0.2.0](https://github.com/jirkapok/GasPlanner/compare/v0.1.38...v0.2.0) (2026-09-21)


### Features

* real bas blender ([a7b71b0](https://github.com/jirkapok/GasPlanner/commit/a7b71b07ec7c27f055d241659bffed42ad8ba602))

## [0.1.38](https://github.com/jirkapok/GasPlanner/compare/v0.1.37...v0.1.38) (2026-04-15)


### Bug Fixes

* weight calculator wrong usage of consumed amount ([66b2932](https://github.com/jirkapok/GasPlanner/commit/66b2932e59180bcf4ea134bfe945e9c8d42fa694))

## [0.1.37](https://github.com/WortoxCZ/GasPlanner/compare/v0.1.36...v0.1.37) (2026-03-30)


### Bug Fixes

* Show highest ceiling only in case it is not 0 m ([d565fa7](https://github.com/WortoxCZ/GasPlanner/commit/d565fa7012e711a8c95eb9848f00489281f393c2))

## [0.1.37](https://github.com/jirkapok/GasPlanner/compare/v0.1.36...v0.1.37) (2026-02-28)


### Bug Fixes

* Show highest ceiling only in case it is not 0 m ([d565fa7](https://github.com/jirkapok/GasPlanner/commit/d565fa7012e711a8c95eb9848f00489281f393c2))
