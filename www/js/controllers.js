angular.module('starter.controllers', [])
    .controller('AppCtrl', function ($scope, $state, $ionicModal, $timeout, Feels, Auth) {
        // With the new view caching in Ionic, Controllers are only called
        // when they are recreated or on app start, instead of every page change.
        // To listen for when this page is active (for example, to refresh data),
        // listen for the $ionicView.enter event:
        // $scope.$on('$ionicView.enter', function(e) {
        // });

        // Form data for the login modal
        $scope.loginData = {
            username: "",
            password: ""
        };

        //var FirebaseTokenGenerator = require("./firebase-token-generator-node.js");
        //var tokenGenerator = new FirebaseTokenGenerator("RHpXfUPsJX53UdV2sXk7yEe9Ebmcq89dtVkH9KEy");

        $scope.feels = Feels;

        $scope.currentUser = {};

        $scope.feelsMessage = {msg: ""};

        // Create the login modal that we will use later
        $ionicModal.fromTemplateUrl('templates/login.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.loginModal = modal;
        });

        // Triggered in the login modal to close it
        $scope.closeLogin = function () {
            $scope.loginModal.hide();
        };

        // Open the login modal
        $scope.login = function () {
            $scope.loginModal.show();
        };

        var ref = new Firebase("https://datfeel.firebaseio.com");

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
                    //$state.go('app.home');
                }
            });

            // Simulate a login delay. Remove this and replace with your login
            // code if using a login system
            $timeout(function () {
                $scope.loading = false;
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

        // Perform the register action when the user submits the register form
        // Reference:     https://www.firebase.com/docs/web/guide/login/password.html
        $scope.doRegister = function () {
            console.log('Registering', $scope.loginData);
            $scope.loading = true;
            ref.createUser({
                email: $scope.loginData.username,
                password: $scope.loginData.password
            }, function (error, userData) {
                if (error) {
                    console.log("Error creating user:", error);
                } else {
                    console.log("Successfully created user account with username:", userData.password.email);
                }
            });

            // Simulate a login delay. Remove this and replace with your login
            // code if using a login system
            $timeout(function () {
                $scope.loading = false;
                $scope.closeLogin();
            }, 1000);
        };


        $scope.$on('$ionicView.enter', function(){
            if(!$scope.loggedIn){
                console.log("No one logged in, going to login view.");
                $scope.login();
            }
        });

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
            console.log("Posting: DFW " + $scope.feelsMessage.msg);
            var PostFeelMessage = "DFW " + $scope.feelsMessage.msg;
            if ($scope.loggedIn && PostFeelMessage) {
                $scope.feels.$add({
                    "user": $scope.currentUser,
                    "feel": PostFeelMessage,
                });
            }
            $scope.feelsMessage.msg = "";
            $scope.closeCreate();
        }
    })
    .filter('reverse', function() {
        return function(items) {
            return items.slice().reverse();
        };
    })
    .factory("Feels", function ($firebaseArray) {
        var itemsRef = new Firebase("https://datfeel.firebaseio.com/feels");
        return $firebaseArray(itemsRef);
    })
    .factory("Auth", function ($firebaseAuth) {
        var usersRef = new Firebase("https://datfeel.firebaseio.com/users");
        return $firebaseAuth(usersRef);
    });