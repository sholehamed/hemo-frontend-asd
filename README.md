# HEMO ASD Frontend
Angular 22 standalone / Angular Material / Persian RTL.

Development: Node version in .node-version; npm install; npm start. The proxy forwards /Identity and /captchaendpoint to http://127.0.0.1:1002 by default; adjust proxy.conf.json to the actual existing host. No change to backend configuration. Production deploy behind same-origin reverse proxy preserving these paths. See docs/HEMO_ASD_FRONTEND_GUIDE_FA.md and docs/HEMO_ASD_WORKLOG.md.
