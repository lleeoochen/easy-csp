"use strict";
exports.__esModule = true;
exports.useAuthState = void 0;
var react_1 = require("react");
var auth_1 = require("firebase/auth");
// This hook only tracks the Firebase authentication state
var useAuthState = function () {
    var _a = (0, react_1.useState)(false), signedIn = _a[0], setSignedIn = _a[1];
    var _b = (0, react_1.useState)(null), userId = _b[0], setUserId = _b[1];
    var _c = (0, react_1.useState)(true), loading = _c[0], setLoading = _c[1];
    var auth = (0, auth_1.getAuth)();
    (0, react_1.useEffect)(function () {
        // Check if user is already signed in
        var unsubscribe = auth.onAuthStateChanged(function (user) {
            if (user) {
                setUserId(user.uid);
                setSignedIn(true);
            }
            else {
                setUserId(null);
                setSignedIn(false);
            }
            setLoading(false);
        });
        return function () { return unsubscribe(); };
    }, [auth]);
    return {
        signedIn: signedIn,
        userId: userId,
        loading: loading
    };
};
exports.useAuthState = useAuthState;
