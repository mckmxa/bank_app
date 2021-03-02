var app = angular.module('paionline');

app.controller('SettingsCtrl', ['$http', '$routeParams', '$window', 'routes', 'common', 'md5', function ($http, $routeParams, $window, routes, common, md5) {
    console.log('Kontroler SettingsCtrl startuje');
    var ctrl = this;

    var _id = null;

    var tokenData = {
        _id: '',
        expiryDateTime: 0,
        person_id: '',
        token: null
    }

    ctrl.token = null
    ctrl.credential = {
        password: '',
        generate: false
    }

    ctrl.visible = function () {
        var route = routes.find(function (el) { return el.route == '/settings' });
        return route && route.roles.includes(common.sessionData.role);
    };

    if ($routeParams && $routeParams.token) {
        $http.get('/token?token=' + $routeParams.token).then(
            function (res) {
                tokenData = res.data;
                if (new Date().getTime() < tokenData.expiryDateTime) {
                    _id = tokenData.person_id;
                    ctrl.token = tokenData.token;
                } else {
                    return;
                }
            },
            function (err) {
                return;
            }
        );
    } else if (!ctrl.visible()) {
        return;
    } else {
        _id = common.sessionData.id;
    }

    var resetCredential = function () {
        ctrl.credential = {
            password: '',
            generate: false
        }
    }

    var deleteToken = function () {
        if (tokenData.token !== null) {
            tokenData.expiryDateTime = new Date().getTime();
            $http.delete('/token?_id=' + tokenData._id + "&token=" + tokenData.token, tokenData).then(
                function (res) {
                    
                },
                function (err) { }
            )
        }
    }

    ctrl.changePassword = function () {
        ctrl.credential.password = md5.createHash(ctrl.credential.password);
        $http.put('/changePassword?_id=' + _id + ((tokenData.token) ? "&token=" + tokenData.token : ""),
            ctrl.credential).then(
            function (res) {
                common.alert('alert-success', 'Hasło zostało zmienione.');
                resetCredential();
                deleteToken();
            },
            function (err) { }
        );
    };
        
}]);