import mixpanel from 'mixpanel-browser';


// In a real app, this should be in .env, but for now we'll allow it to be skipped if not provided
// Or if there's a token, we initialize.
const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN || 'dummy-token-for-dev';

mixpanel.init(MIXPANEL_TOKEN, {
  debug: import.meta.env.DEV,
  track_pageview: true,
  persistence: 'localStorage',
});

export const analytics = {
  track: (eventName: string, properties?: Record<string, unknown>) => {
    mixpanel.track(eventName, properties);
  },
  identify: (userId: string) => {
    mixpanel.identify(userId);
  },
  reset: () => {
    mixpanel.reset();
  }
};
