var app = angular.module('paionline')

app.controller('PersonsCtrl', ['$http', 'routes', 'common', 'Utils', 'md5', function ($http, routes, common, Utils, md5) {
    console.log('Kontroler PersonCtrl startuje')
        
    var ctrl = this

    ctrl.visible = function() {
        var route = routes.find(function(el) { return el.route == '/persons' })
        return route && route.roles.includes(common.sessionData.role)
    }
    if(!ctrl.visible()) return

    ctrl.selected = -1

    ctrl.persons = []
    ctrl.history = []

    ctrl.roleMin = 1;
    ctrl.roleMax = 2;

    ctrl.person = {
        firstName: '',
        lastName: '',
        year: 1970,
        email: '',
        active: true
    };

    ctrl.credential = {
        credential_id: '',
        person_id: '',
        password: '',
        generate: false,
        role: 1
    };

    ctrl.tokenLink = '';

    /**
     * persons = {
     *  _id, firstName, lastName, amount, email, credential_id, role, password, generate
     * }
     */
    var refreshPersons = function() {
        $http.get('/personsWithCredentials').then(
            function(res) {
                ctrl.persons = res.data
                ctrl.selected = -1;

                resetPerson();
                resetCredential();
            },
            function(err) {}
        )
    }

    var refreshPerson = function() {
        $http.get('/personsWithCredentials?_id=' + ctrl.persons[ctrl.selected]._id).then(
            function (res) {
                var data = res.data[0];
                ctrl.person = {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    year: data.year,
                    email: data.email,
                };
                ctrl.credential = {
                    credential_id: data.credential_id,
                    person_id: data.person_id,
                    password: data.password,
                    generate: data.generate,
                    role: data.role,
                };
            },
            function(err) {}
        )
    }

    var isEmailUnique = function (email) {
        return $http.get('/person?email=' + email);
    }

    var resetPerson = function () { 
        ctrl.person = {
            firstName: '',
            lastName: '',
            year: 1970,
            email: '',
            active: true
        };
    }

    var resetCredential = function () {
        ctrl.credential = {
            credential_id: '',
            person_id: '',
            password: '',
            generate: true,
            role: 1
        };
    }

    var setEmailValidity = function (form, valid) {
        form.email.$setValidity("unique", valid);
    }

    resetPerson();
    resetCredential();
    refreshPersons();

    ctrl.insertNewData = function (form) {
        isEmailUnique(ctrl.person.email).then(
            function (res) {
                if (!Utils.isNullOrUndefined(res.data)) {
                    setEmailValidity(form, false);
                } else {
                    $http.post('/person', ctrl.person).then(
                        function (res) {
                            ctrl.credential.person_id = res.data._id;
                            if (!ctrl.credential.generate) {
                                ctrl.credential.password =
                                    md5.createHash(ctrl.credential.password);
                            }
                            $http.post('/credential?_id=' + ctrl.credential.person_id, ctrl.credential).then(
                                function (res) {
                                    setEmailValidity(form, true);
                                    refreshPersons();       
                                },
                                function (err) { }
                            )
                        },
                        function (err) { }
                    );
                }
            },
            function(err) { }
        )
    }

    ctrl.select = function(index) {
        ctrl.selected = index
        refreshPerson()
    }

    ctrl.updateData = function (form) {
        isEmailUnique(ctrl.person.email).then(
            function (res) {
                if (Utils.isNullOrUndefined(res.data) || (!Utils.isNullOrUndefined(res.data)
                    && res.data._id === ctrl.persons[ctrl.selected]._id)) {
                    $http.put('/person?_id=' + ctrl.persons[ctrl.selected]._id, ctrl.person).then(
                        function (res) {
                            $http.put('/credential?_id=' + ctrl.credential.credential_id, ctrl.credential).then(
                                function (res) {
                                    setEmailValidity(form, true);
                                    refreshPersons();
                                },
                                function (err) { }
                            )
                        },
                        function (err) { }
                    )
                } else {
                    setEmailValidity(form, false);
                }
            }
        )
    }

    var showDeleteConfirmationDialog = function () {
        common.dialog('confirmDialog.html', 'ConfirmDialog', {   
            title: "Potwierdzenie usunięcia ...",
            body: "Czy jesteś pewien, że chcesz usunąć uzytkownika "
                + ctrl.persons[ctrl.selected].firstName + " " + ctrl.persons[ctrl.selected].lastName +
                " ?",
            onOK: true,
            onCancel: true
        }, function(result) {
            if(result) {
                $http.delete('/person?_id=' + ctrl.persons[ctrl.selected]._id).then(
                    function(res) {
                        refreshPersons();
                        common.alert('alert-success', 'Usunięto')
                    },
                    function(err) {}
                )    
            }
        })
    }

    ctrl.deleteData = function() {
        showDeleteConfirmationDialog();
    }

    ctrl.cancelData = function () {
        resetCredential();
        resetPerson();
        refreshPersons();
    }

    ctrl.passwordGenerate = function () {
        var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
        for (var i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        ctrl.credential.password = retVal;
        ctrl.credential.generate = true;
    }

    ctrl.onUserPasswordChange = function () {
        ctrl.credential.generate = false;
    }

    ctrl.onUserEmailChange = function (form) {
        setEmailValidity(form, true);
    }

    ctrl.tokenGenerate = function () {
        var personId = ctrl.persons[ctrl.selected]._id;
        var token = md5.createHash(new Date().getTime().toString() + ";" + personId);
        
        var date = new Date();
        date = new Date(date.setTime(date.getTime() + (120000))).getTime();
        // 120000 - 2 min

        var personToken = {
            person_id: personId,
            token: token,
            expiryDateTime: date
        }

        $http.post('/token?_id=' + personId, personToken).then(
            function (res) {
                ctrl.tokenLink = location.protocol + "//" + location.host + "/#/settings?token=" + token;
            },
            function (err) { }
        );
    }
}])

app.factory('Utils', function() {
    var service = {
       isNullOrUndefined: function(obj) {
           return !angular.isDefined(obj) || obj===null;
       }
    }
    return service;
});

app.directive('ngMin', function() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, elem, attr, ctrl) {
            scope.$watch(attr.ngMin, function(){
                ctrl.$setViewValue(ctrl.$viewValue);
            });
            var minValidator = function(value) {
              var min = scope.$eval(attr.ngMin) || 0;
              if (value !== undefined && value < min) {
                ctrl.$setValidity('ngMin', false);
                return undefined;
              } else {
                ctrl.$setValidity('ngMin', true);
                return value;
              }
            };

            ctrl.$parsers.push(minValidator);
            ctrl.$formatters.push(minValidator);
        }
    };
});

app.directive('ngMax', function() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, elem, attr, ctrl) {
            scope.$watch(attr.ngMax, function(){
                ctrl.$setViewValue(ctrl.$viewValue);
            });
            var maxValidator = function(value) {
              var max = scope.$eval(attr.ngMax) || Infinity;
              if (value !== undefined && value > max) {
                ctrl.$setValidity('ngMax', false);
                return undefined;
              } else {
                ctrl.$setValidity('ngMax', true);
                return value;
              }
            };

            ctrl.$parsers.push(maxValidator);
            ctrl.$formatters.push(maxValidator);
        }
    };
});