// AdMob stub — AdMob is disabled completely.
// This stub prevents import errors when any file references AdMob packages.

const noop = () => {};
const noopAsync = async () => {};

const BannerAd = () => null;
const InterstitialAd = { createForAdRequest: () => ({ load: noop, show: noopAsync, addAdEventListener: noop, removeAllListeners: noop }) };
const RewardedAd = { createForAdRequest: () => ({ load: noop, show: noopAsync, addAdEventListener: noop, removeAllListeners: noop }) };
const RewardedInterstitialAd = { createForAdRequest: () => ({ load: noop, show: noopAsync, addAdEventListener: noop, removeAllListeners: noop }) };
const AppOpenAd = { createForAdRequest: () => ({ load: noop, show: noopAsync, addAdEventListener: noop, removeAllListeners: noop }) };

const mobileAds = () => ({ initialize: noopAsync });

module.exports = {
  default: mobileAds,
  mobileAds,
  BannerAd,
  InterstitialAd,
  RewardedAd,
  RewardedInterstitialAd,
  AppOpenAd,
  BannerAdSize: {},
  TestIds: {},
  AdEventType: {},
  RewardedAdEventType: {},
  MaxAdContentRating: {},
  AdsConsentStatus: {},
  AdsConsentDebugGeography: {},
  AdsConsent: { requestInfoUpdate: noopAsync, showForm: noopAsync, reset: noop },
};
