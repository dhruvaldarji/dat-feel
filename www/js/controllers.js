angular.module('starter.controllers', [])
    .controller('AppCtrl', function ($scope, $state, $ionicModal, $localstorage, $timeout, Feels, Root) {
        // With the new view caching in Ionic, Controllers are only called
        // when they are recreated or on app start, instead of every page change.
        // To listen for when this page is active (for example, to refresh data),
        // listen for the $ionicView.enter event:

        // Form data for the login modal
        $scope.loginData = {
            username: "",
            password: ""
        };

        $scope.registerData = {
            username: "",
            password: "",
            firstname: "",
            lastname: "",
        };

        //var FirebaseTokenGenerator = require("./firebase-token-generator-node.js");
        //var tokenGenerator = new FirebaseTokenGenerator("RHpXfUPsJX53UdV2sXk7yEe9Ebmcq89dtVkH9KEy");

        $scope.feels = Feels;

        $scope.currentUser = {};

        $scope.feelsMessage = {
            msg: "",
            user: "",
            date: "",
            feltBy: [],
            comments: []
        };

        var ref = new Firebase("https://datfeel.firebaseio.com");

        $scope.$on('app.loggedOut', function(e) {
            // Show the modal here
        });

        $scope.homeInit = function() {
            if (!$scope.loggedIn) {
                console.log("No one is logged in, checking local storage.");

                var loginInfo = $localstorage.getObject('loginData').loginData;
                console.log("Localstorage: ", loginInfo);
                if ($scope.loginData.remember === false) {
                    console.log("No login is saved, please login with email and password.");
                    $scope.loginData = {};
                }
                else {
                    $scope.loginData.username = loginInfo.username;
                    $scope.loginData.password = loginInfo.password;
                    $scope.loginData.remember = loginInfo.remember;
                }
            }
        };

        // Create the login modal that we will use later
        $ionicModal.fromTemplateUrl('templates/login.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.loginModal = modal;
            $scope.login();
        });

        $scope.login = function() {
            $scope.loginModal.show();
        };

        $scope.closeLogin = function() {
            $scope.loginModal.hide();
        };

        // Perform the login action when the user submits the login form
        // Reference:     https://www.firebase.com/docs/web/guide/login/password.html
        $scope.doLogin = function () {
            console.log('Doing login', $scope.loginData);

            $scope.loading = true;
            ref.authWithPassword({
                email: $scope.loginData.username,
                password: $scope.loginData.password
            }, function (error, authData) {
                if (error) {
                    alert("Login Failed: " + error);
                    console.log("Login Failed!", error);
                } else {
                    console.log("Successfully logged in account with username:", authData.password.email);
                    $scope.currentUser = authData.password.email;
                    $scope.loggedIn = true;
                }
            });

            // Simulate a login delay. Remove this and replace with your login
            // code if using a login system
            $timeout(function () {
                $scope.loading = false;
                if($scope.loginData.remember){
                    $localstorage.setObject('loginData', {
                        loginData: $scope.loginData
                    });
                }
                else{
                    $scope.loginData = {
                        username: "",
                        password: "",
                        remember: false
                    };
                    $localstorage.setObject('loginData', {
                        loginData: $scope.loginData
                    });
                }
                $scope.closeLogin();
            }, 1000);
        };

        $scope.doLogout = function () {
            console.log('Doing Logout');
            $scope.loading = true;
            $scope.currentUser = {};
            ref.unauth();
            $scope.loggedIn = false;
            // Simulate a login delay. Remove this and replace with your login
            // code if using a login system
            $timeout(function () {
                $scope.loading = false;
                $scope.closeLogin();
            }, 1000);
        };

        // Create the login modal that we will use later
        $ionicModal.fromTemplateUrl('templates/register.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.registerModal = modal;
        });

        $scope.register = function() {
            $scope.registerModal.show();
        };

        $scope.closeRegister = function() {
            $scope.registerModal.hide();
        };

        $scope.goToRegister = function(){
            $scope.register();
            $scope.closeLogin();
        }

        $scope.goToLogin = function(){
            $scope.login();
            $scope.closeRegister();
        }

        // Perform the register action when the user submits the register form
        // Reference:     https://www.firebase.com/docs/web/guide/login/password.html
        $scope.doRegister = function () {
            console.log('Registering', $scope.registerData);
            $scope.loading = true;
            ref.createUser({
                email: $scope.registerData.username,
                password: $scope.registerData.password,
            }, function(error, userData) {
                if (error) {
                    switch (error.code) {
                        case "EMAIL_TAKEN":
                            console.log("The new user account cannot be created because the email is already in use.");
                            break;
                        case "INVALID_EMAIL":
                            console.log("The specified email is not a valid email.");
                            break;
                        default:
                            console.log("Error creating user:", error);
                    }
                } else {
                    remember: "sessionOnly";
                    console.log("Successfully created user account with uid:", userData.uid);

                    // Simulate a register delay. Remove this and replace with your login
                    // code if using a login system
                    $timeout(function () {
                        $scope.closeRegister();
                        $scope.login();
                    }, 1000);
                }
            });

            $scope.loading = false;
            $scope.registerData = {
                username: "",
                password: ""
            };
        };

        // Create the login modal that we will use later
        $ionicModal.fromTemplateUrl('templates/create.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.createModal = modal;
        });

        // Triggered in the login modal to close it
        $scope.closeCreate = function () {
            $scope.createModal.hide();
        };

        // Open the login modal
        $scope.Create = function () {
            $scope.createModal.show();
        };

        $scope.postFeel = function () {
            // Post message using user, message, and time.
            var PostFeelMessage = "DFW " + $scope.feelsMessage.msg;
            var date = new Date();
            console.log("Posting: "+ PostFeelMessage+ " on "+ date);
            if ($scope.loggedIn && PostFeelMessage) {
                $scope.feels.$add({
                    "user": $scope.currentUser,
                    "date": date.toDateString(),
                    "feel": PostFeelMessage,
                    "feltBy": [],
                    "comments": []
                });
            }
            $scope.feelsMessage = {
                msg: "",
                user: "",
                date: "",
                feltBy: [],
                comments: []
            };
            $scope.closeCreate();
        }

        $scope.deleteFeel = function(id){
            var num = $scope.feels.length-id-1;
            var userDeleting = $scope.feels[num].user;
            if($scope.currentUser === userDeleting){
                var isConfirmed = confirm("Are you sure you want to delete DFW #"+num+".");
                if (isConfirmed){
                    console.log("User: "+userDeleting+", is deleting DFW "+num+".");
                    $scope.feels.$remove(num);
                }
            }
            else {
                console.log("User: "+$scope.currentUser+" does not have permission to delete DFW "+num+".");
            }
        }

        $scope.feelingItUp = function(id){
            //console.log("User: "+$scope.currentUser+", is feeling up DFW #"+num+".");
            //alert("User: "+$scope.currentUser+" is feeling up DFW #"+num+".");
            var add = true;
            var num = $scope.feels.length-id-1;
            var currentFeel = $scope.feels[num];
            var currentUserNum = -1;
            if((typeof(currentFeel) !== 'undefined') && (currentFeel.feltBy)){
                var numFelt = currentFeel.feltBy.length;
                console.log("The feel has "+numFelt+" feel(s).")
                for(var i = 0; i < numFelt; i++){
                    if(currentFeel.feltBy[i] === $scope.currentUser) {
                        add = false;
                        currentUserNum = i;
                    }
                }
                if(add){
                    currentFeel.feltBy.push($scope.currentUser);
                    $scope.feels.$save(num);
                    //alert("User: "+$scope.currentUser+" is feeling up DFW #"+num+".");
                }
                else{
                    //alert("User: "+$scope.currentUser+" has already felt up DFW #"+num+".");
                    //alert("User: "+$scope.currentUser+" is unfeeling DFW #"+num+".");
                    if(currentUserNum > -1){
                        currentFeel.feltBy.splice(currentUserNum,1);
                        $scope.feels.$save(num);
                    }
                }
            }
            else {
               currentFeel.feltBy = [$scope.currentUser];
                $scope.feels.$save(num);
                //alert("User: "+$scope.currentUser+" is feeling up DFW #"+num+". Feel was undefined, user was added.");
            }
        }

        $scope.commentFeel = function(id){
            var num = $scope.feels.length-id-1;
            console.log("User: "+$scope.currentUser+", is commenting on DFW #"+num+".");
            alert("User: "+$scope.currentUser+" is commenting on DFW #"+num+".");

        }

        $scope.shareFeel = function(id){
            var num = $scope.feels.length-id-1;
            console.log("User: "+$scope.currentUser+", is sharing DFW #"+num+".");
            alert("User: "+$scope.currentUser+" is sharing DFW #"+num+".");

        }
    })
    .filter('reverse', function() {
        return function(items) {
            return items.slice().reverse();
        };
    })
    .factory("Feels", function ($firebaseArray) {
        var itemsRef = new Firebase("https://datfeel.firebaseio.com/feels");
        //console.log("Data", itemsRef);
        return $firebaseArray(itemsRef);
    })
    .factory("Auth", function ($firebaseAuth) {
        var usersRef = new Firebase("https://datfeel.firebaseio.com/users");
        return $firebaseAuth(usersRef);
    })
    .factory('$localstorage', ['$window', function($window) {
        return {
            set: function(key, value) {
                $window.localStorage[key] = value;
            },
            get: function(key, defaultValue) {
                return $window.localStorage[key] || defaultValue;
            },
            setObject: function(key, value) {
                $window.localStorage[key] = JSON.stringify(value);
            },
            getObject: function(key) {
                return JSON.parse($window.localStorage[key] || '{}');
            }
        }}
    ])
    .factory('Root', function($rootScope) {
        return {
            checkLogin: function() {
                // Check if logged in and fire events
                if(this.isLoggedIn()) {
                    $rootScope.$broadcast('app.loggedIn');
                } else {
                    $rootScope.$broadcast('app.loggedOut');
                }
            },
            isLoggedIn: function() {
                // Check auth token here from localStorage
            },
            login: function(user, pass) {
                // Do the login
                // When done, trigger an event:
                $rootScope.$broadcast('app.loggedIn');
            },
            logout: function(user, pass) {
                // Same thing, log out user
                $rootScope.$broadcast('app.loggedOut');
            }
        }
    });