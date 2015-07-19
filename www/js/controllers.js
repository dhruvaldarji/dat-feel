angular.module('starter.controllers', [])
    .controller('AppCtrl', function ($scope, $state, $ionicModal, $timeout,
                                     $localstorage, Feels, Users, $rootScope,
                                     $ionicUser, $ionicPush, $http,
                                     $ionicPopup, $ionicPopover, $ionicLoading) {

        // Form data for the login modal
        $scope.loginData = {
            username: "",
            password: "",
            remember: false
        };

        $scope.registerData = {
            username: "",
            password: "",
            firstname: "",
            lastname: "",
        };

        $scope.isAdmin = false;

        $scope.isConfirmed = false;

        //var FirebaseTokenGenerator = require("./firebase-token-generator-node.js");
        //var tokenGenerator = new FirebaseTokenGenerator("RHpXfUPsJX53UdV2sXk7yEe9Ebmcq89dtVkH9KEy");

        $scope.feels = Feels;

        $scope.users = Users;

        $scope.currentUser = {};

        $scope.feelsMessage = {
            msg: "",
            attachments: [], // Links, images, etc
            user: "",
            date: "",
            feltBy: [],
            comments: []
        };

        $scope.adminFeelsMessage = {
            msg: "",
            attachments: [], // Links, images, etc
            user: "",
            date: "",
            feltBy: [],
            comments: []
        };

        $scope.commentingFeel = {};
        $scope.commentingMessage = {
            index: -1,
            msg: ""
        };

        //Solves Websocket fail issue for mobile
        if ($localstorage.getObject('firebase:previous_websocket_failure')) {
            $localstorage.setObject('firebase:previous_websocket_failure', false);
        }

        var ref = new Firebase("https://datfeel.firebaseio.com");

        $scope.showLoading = function () {
            $ionicLoading.show({
                template: '<ion-spinner icon="ripple" class="spinner-energized"></ion-spinner>',
                animation: 'fade-in',
                noBackdrop: false,
            });
        };
        $scope.hideLoading = function () {
            $ionicLoading.hide();
        };

        // A confirm dialog
        $scope.showConfirm = function (title, template) {
            var confirmPopup = $ionicPopup.confirm({
                title: title,
                template: template
            });
            confirmPopup.then(function (res) {
                return res;
                $scope.isConfirmed = res;
                if (res) {
                    console.log('Confirmed');
                    $scope.confirmSuccess();
                } else {
                    console.log('Not Confirmed');
                    $scope.confirmFail();
                }
            });
        };

        // An alert dialog
        $scope.showAlert = function (title, template) {
            var alertPopup = $ionicPopup.alert({
                title: title,
                template: template
            });
            alertPopup.then(function (res) {
                console.log("Error: " + error);
            });
        };

        $scope.$on('app.loggedOut', function (e) {
            // Show the modal here
            $scope.login();
        });

        $scope.homeInit = function () {
            if (!$scope.loggedIn) {
                console.log("No one is logged in, checking local storage.");

                var loginInfo = $localstorage.getObject('loginData').loginData;
                console.log("Localstorage: ", loginInfo);
                if ($scope.loginData.remember === undefined) {
                    console.log("No login is saved, please login with email and password.");
                    $scope.loginData = {
                        username: "",
                        password: "",
                        remember: false
                    };
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
        }).then(function (modal) {
            $scope.loginModal = modal;
            $scope.showLoading();
            $scope.login();
        });

        $scope.login = function () {
            $scope.loginModal.show();
            $timeout(function () {
                $scope.hideLoading();
            }, 500);
        };

        $scope.closeLogin = function () {
            $scope.loginModal.hide();
        };

        // Perform the login action when the user submits the login form
        // Reference:     https://www.firebase.com/docs/web/guide/login/password.html
        $scope.doLogin = function () {
            console.log('Doing login', $scope.loginData);
            $scope.showLoading();

            ref.authWithPassword({
                email: $scope.loginData.username,
                password: $scope.loginData.password
            }, function (error, authData) {
                if (error) {
                    // An alert dialog
                    $scope.showAlert('Login Failed', error);
                    console.log("Login Failed: ", error);
                } else {
                    console.log("Successfully logged in account with username:", authData.password.email);
                    $scope.currentUser = authData.password.email;
                    $scope.loggedIn = true;

                    // An alert dialog
                    //$scope.showAlert('Login Success', "Logged in as " +$scope.currentUser);
                    console.log("Logged in as " + $scope.currentUser);

                    // Identify user for Pushes
                    $scope.identifyUser();

                    // Register user for Pushes
                    $scope.pushRegister();
                }

                // Simulate a login delay. Remove this and replace with your login
                // code if using a login system
                $timeout(function () {
                    if ($scope.loggedIn) {
                        if ($scope.loginData.remember) {
                            $localstorage.setObject('loginData', {
                                loginData: $scope.loginData
                            });
                        }
                        else {
                            $scope.loginData = {
                                username: "",
                                password: "",
                                remember: false
                            };
                            $localstorage.setObject('loginData', {
                                loginData: $scope.loginData
                            });
                        }
                    }
                    $scope.closeLogin();
                    $scope.hideLoading();
                }, 1000);
            });
        };

        $scope.doLogout = function () {
            console.log('Doing Logout');
            $scope.showLoading();
            $timeout(function () {
                $scope.loggedIn = false;
                $scope.currentUser = {};
                ref.unauth();
                $scope.login();
            }, 1000);
        };

        // Create the login modal that we will use later
        $ionicModal.fromTemplateUrl('templates/register.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.registerModal = modal;
        });

        $scope.register = function () {
            $scope.registerModal.show();
        };

        $scope.closeRegister = function () {
            $scope.registerModal.hide();
        };

        $scope.goToRegister = function () {
            $scope.register();
            $scope.closeLogin();
        }

        $scope.goToLogin = function () {
            $scope.login();
            $scope.closeRegister();
        }

        // Perform the register action when the user submits the register form
        $scope.doRegister = function () {
            console.log('Registering', $scope.registerData);
            ref.createUser({
                email: $scope.registerData.username,
                password: $scope.registerData.password,
            }, function (error, userData) {
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

            $scope.registerData = {
                username: "",
                password: ""
            };
        };

        // Handles incoming device tokens
        $rootScope.$on('$cordovaPush:tokenReceived', function (event, data) {
            //alert("Successfully registered token " + data.pushToken);
            console.log('Ionic Push: Got token ', data.token, data.platform);
            $scope.pushToken = data.token;
            $scope.pushPlatform = data.platform;

            //console.log("Searching for user in DB...");
            var userFound = false;
            for (var i = 0; i < $scope.users.length; i++) {
                if ($scope.currentUser === $scope.users[i].username) {
                    console.log("User found in DB.")
                    userFound = true;

                    //check if isAdmin
                    console.log("User: ", $scope.users[i]);
                    if ($scope.users[i].isAdmin) {
                        $scope.isAdmin = true;
                        console.log("User is Admin");
                    }
                    else {
                        console.log("User is not Admin");
                        $scope.isAdmin = false;
                    }

                    console.log("Setting user deviceToken");
                    $scope.users[i].deviceToken = $scope.pushToken;
                    $scope.users.$save(i);
                    break;
                }
            }
            if (!userFound) {
                console.log("User not Found. Adding user to DB");
                $scope.users.$add({
                    "username": $scope.currentUser,
                    "deviceToken": $scope.pushToken
                });
            }

        });

        // Identifies a user with the Ionic User service
        $scope.identifyUser = function () {
            console.log('Ionic User: Identifying with Ionic User service');

            var user = $ionicUser.get();
            if (!user.user_id) {
                // Set your user_id here, or generate a random one.
                //user.user_id = $ionicUser.generateGUID();
                user.user_id = $scope.currentUser;
            }

            // Add some metadata to your user object.
            angular.extend(user, {
                name: $scope.currentUser,
                pushToken: $scope.pushToken,
                bio: 'I like to use DatFeel to post Feels.'
            });

            // Identify your user with the Ionic User Service
            $ionicUser.identify(user).then(function () {
                $scope.identified = true;
                console.log('Identified user ' + user.name + '\n ID ' + user.user_id);
                //alert('Identified user ' + user.name + '\n ID ' + user.user_id);
            });
        };

        // Registers a device for push notifications and stores its token
        $scope.pushRegister = function () {
            console.log('Ionic Push: Registering user');

            // Register with the Ionic Push service.  All parameters are optional.
            $ionicPush.register({
                canShowAlert: true, //Can pushes show an alert on your screen?
                canSetBadge: true, //Can pushes update app icon badges?
                canPlaySound: true, //Can notifications play a sound?
                canRunActionsOnWake: true, //Can run actions outside the app,
                onNotification: function (notification) {
                    // Handle new push notifications here
                    //console.log(notification);
                    $scope.showAlert("Notification", notification);
                    return true;
                }
            });
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

        // Post a feel to the DB
        $scope.postFeel = function () {
            // Post message using user, message, and time.
            var PostFeelMessage = "DFW " + $scope.feelsMessage.msg;
            var date = new Date();
            console.log("Posting: " + PostFeelMessage + " on " + date);
            if ($scope.loggedIn && PostFeelMessage) {
                $scope.feels.$add({
                    "user": $scope.currentUser,
                    "attachments": [],
                    "date": date.toLocaleString(),
                    "feel": PostFeelMessage,
                    "feltBy": [],
                    "comments": []
                });
            }
            $scope.feelsMessage = {
                msg: "",
                attachments: [],
                user: "",
                date: "",
                feltBy: [],
                comments: []
            };

            //list of all tokens
            var allTokens = [];

            console.log("Adding all user tokens for push");
            for (var i = 0; i < $scope.users.length; i++) {
                if ($scope.users[i].username !== $scope.currentUser) {
                    allTokens.push($scope.users[i].deviceToken);
                }
            }

            var data = {
                "tokens": allTokens,
                "notification": {
                    "alert": $scope.currentUser + ":\n" + PostFeelMessage,
                    "ios": {
                        "badge": 1,
                        "sound": "ping.aiff",
                        "expiry": 1423238641,
                        "priority": 10,
                        "contentAvailable": true,
                        "payload": {
                            "key1": "value",
                            "key2": "value"
                        }
                    },
                    "android": {
                        "collapseKey": "foo",
                        "delayWhileIdle": true,
                        "timeToLive": 300,
                        "payload": {
                            "key1": "value",
                            "key2": "value"
                        }
                    }
                }
            }

            var privateAPIKey = window.btoa("4f9d0ac7d03bb78f24ef5b63cbbe89e70dff090aeb2f027b");

            $http.post('https://push.ionic.io/api/v1/push', data, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Ionic-Application-Id': '45ec6dc0',
                    'Authorization': "Basic " + privateAPIKey
                }
            }).success(function (data, status, headers, config) {
                // this callback will be called asynchronously
                // when the response is available
                console.log("Data Pushed!!!", data, status, headers, config)
            }).
                error(function (data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    console.log("Data not pushed: ", data, status, headers, config)
                });

            $scope.closeCreate();
        }

        // Delete a feel from the DB
        $scope.deleteFeel = function (id) {
            var num = $scope.feels.length - id - 1;
            var userDeleting = $scope.feels[num].user;
            if ($scope.currentUser === userDeleting) {
                var isConfirmed = confirm("Are you sure you want to delete DFW #" + num + ".");
                if (isConfirmed) {
                    console.log("User: " + userDeleting + ", is deleting DFW " + num + ".");
                    $scope.feels.$remove(num);
                }
            }
            else {
                console.log("User: " + $scope.currentUser + " does not have permission to delete DFW " + num + ".");
            }
        }

        // Feeling a feel (liking) (hearts)
        $scope.feelingItUp = function (id) {
            //console.log("User: "+$scope.currentUser+", is feeling up DFW #"+num+".");
            //alert("User: "+$scope.currentUser+" is feeling up DFW #"+num+".");
            var add = true;
            var num = $scope.feels.length - id - 1;
            var currentFeel = $scope.feels[num];
            var currentUserNum = -1;
            if ((typeof(currentFeel) !== 'undefined') && (currentFeel.feltBy)) {
                var numFelt = currentFeel.feltBy.length;
                //console.log("The feel has " + numFelt + " feel(s).")
                for (var i = 0; i < numFelt; i++) {
                    if (currentFeel.feltBy[i] === $scope.currentUser) {
                        add = false;
                        currentUserNum = i;
                    }
                }
                if (add) {
                    currentFeel.feltBy.push($scope.currentUser);
                    $scope.feels.$save(num);
                    //alert("User: "+$scope.currentUser+" is feeling up DFW #"+num+".");
                }
                else {
                    //alert("User: "+$scope.currentUser+" has already felt up DFW #"+num+".");
                    //alert("User: "+$scope.currentUser+" is unfeeling DFW #"+num+".");
                    if (currentUserNum > -1) {
                        currentFeel.feltBy.splice(currentUserNum, 1);
                        $scope.feels.$save(num);
                    }
                }
            }
            else {
                currentFeel.feltBy = [$scope.currentUser];
                $scope.feels.$save(num);
                //alert("User: "+$scope.currentUser+" is feeling up DFW #"+num+". Feel was undefined, user was added.");
            }
        };

        // Create the login modal that we will use later
        $ionicModal.fromTemplateUrl('templates/postComment.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.commentModal = modal;
        });

        // Triggered in the login modal to close it
        $scope.closeComment = function () {
            $scope.commentModal.hide();
        };

        // Open the login modal
        $scope.comment = function (id) {
            var num = $scope.feels.length - id - 1;
            $scope.commentingFeel = $scope.feels[num];
            $scope.commentingMessage.index = num;
            //console.log("Opening Comment Modal for Feel ", $scope.commentingMessage.index);
            $scope.commentModal.show();
        };

        // Commenting a feel
        $scope.commentOnFeel = function () {
            //console.log("User: "+$scope.currentUser+", is commenting on DFW #"+$scope.commentingMessage.index+".");
            //alert("User: "+$scope.currentUser+" is commenting on DFW #"+$scope.commentingMessage.index+".");
            var currentFeel = $scope.feels[$scope.commentingMessage.index];
            var currentUserNum = -1;
            if($scope.commentingMessage.msg != ""){
                if ((typeof(currentFeel) !== 'undefined') && (currentFeel.comments)) {
                    var numCommented = $scope.commentingFeel.comments.length;
                    //console.log("The feel has " + numCommented + " comment(s).")
                    currentFeel.comments.push({user: $scope.currentUser, comment: $scope.commentingMessage.msg, date: (new Date()).toLocaleString()});
                    $scope.feels.$save($scope.commentingMessage.index);
                    //alert("User: "+$scope.currentUser+" is commenting on DFW #"+$scope.commentingMessage.index+".");
                }
                else {
                    currentFeel.comments = [{
                        user: $scope.currentUser,
                        comment: $scope.commentingMessage.msg,
                        date: (new Date()).toLocaleString()
                    }];
                    $scope.feels.$save($scope.commentingMessage.index);
                    //alert("User: "+$scope.currentUser+" is commenting on DFW #"+$scope.commentingMessage.index+". Feel was undefined, user was added.");
                }
            }
            $scope.commentingMessage.msg = "";
        };

        // Delete a feel from the DB
        $scope.deleteComment = function (id) {
            var num = $scope.commentingMessage.index;
            //console.log("DFW # " + num + ", Comment # ", id);
            var userDeleting = $scope.feels[num].comments[id].user;
            if ($scope.currentUser === userDeleting) {

                var confirmPopup = $ionicPopup.confirm({
                    title: "Delete Comment",
                    template: "Are you sure you want to delete this comment?"
                });
                confirmPopup.then(function (res) {
                    console.log('Confirmed', res);
                    if (res) {
                        //console.log("User: " + userDeleting + ", is deleting comment " + id + "of DFW " + num + ".");
                        $scope.feels[num].comments.splice(id,1);
                        $scope.feels.$save(num);
                    } else {
                        //console.log('Cancelled');
                    }
                    return res;
                });
            }
            else {
                //console.log("User: " + $scope.currentUser + " does not have permission to delete Comment " + id + "from DFW " + num + ".");
            }
        };

        // Sharing a feel
        //$scope.shareFeel = function(id){
        //    var num = $scope.feels.length-id-1;
        //    console.log("User: "+$scope.currentUser+", is sharing DFW #"+num+".");
        //    alert("User: "+$scope.currentUser+" is sharing DFW #"+num+".");
        //
        //}

        // Create the login modal that we will use later
        $ionicModal.fromTemplateUrl('templates/adminCreate.html', {
            scope: $scope
        }).then(function (modal) {
            $scope.createAdminModal = modal;
        });

        // Triggered in the login modal to close it
        $scope.closeAdminCreate = function () {
            $scope.createAdminModal.hide();
        };

        // Open the login modal
        $scope.adminCreate = function () {
            $scope.createAdminModal.show();
        };

        // Post a feel to the DB
        $scope.postAdminFeel = function () {
            // Post message using user, message, and time.
            var PostFeelMessage = $scope.adminFeelsMessage.msg;
            var date = new Date();
            console.log("Posting: " + PostFeelMessage + " on " + date);
            if ($scope.loggedIn && PostFeelMessage) {
                $scope.feels.$add({
                    "user": $scope.currentUser,
                    "attachments": [],
                    "date": date.toLocaleString(),
                    "feel": PostFeelMessage,
                    "feltBy": [],
                    "comments": []
                });
            }
            $scope.adminFeelsMessage = {
                msg: "",
                attachments: [],
                user: "",
                date: "",
                feltBy: [],
                comments: []
            };

            //list of all tokens
            var allTokens = [];

            //console.log("Adding all user tokens for push");
            for (var i = 0; i < $scope.users.length; i++) {
                if ($scope.users[i].username !== $scope.currentUser) {
                    allTokens.push($scope.users[i].deviceToken);
                }
            }

            //Test Push on Dhruval
            //allTokens.push("92b3476b085b92324d5b98b1e89d67b4730f67cb11d327c6d8813589b470e7cd");

            var data = {
                "tokens": allTokens,
                "notification": {
                    "alert": "Message From Admins:\n" + PostFeelMessage,
                    "ios": {
                        "badge": 1,
                        "sound": "ping.aiff",
                        "expiry": 1423238641,
                        "priority": 10,
                        "contentAvailable": true,
                        "payload": {
                            "key1": "Message From Admins",
                            "key2": PostFeelMessage
                        }
                    },
                    "android": {
                        "collapseKey": "foo",
                        "delayWhileIdle": true,
                        "timeToLive": 300,
                        "payload": {
                            "key1": "Message From Admins",
                            "key2": PostFeelMessage
                        }
                    }
                }
            }

            var privateAPIKey = window.btoa("4f9d0ac7d03bb78f24ef5b63cbbe89e70dff090aeb2f027b");

            $http.post('https://push.ionic.io/api/v1/push', data, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Ionic-Application-Id': '45ec6dc0',
                    'Authorization': "Basic " + privateAPIKey
                }
            }).success(function (data, status, headers, config) {
                // this callback will be called asynchronously
                // when the response is available
                console.log("Data Pushed!!!", data, status, headers, config)
            }).
                error(function (data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    console.log("Data not pushed: ", data, status, headers, config)
                });

            $scope.closeAdminCreate();
        }

    })
    .filter('reverse', function () {
        return function (items) {
            return items.slice().reverse();
        };
    })
    .factory("Feels", function ($firebaseArray) {
        var itemsRef = new Firebase("https://datfeel.firebaseio.com/feels");
        //console.log("Data", itemsRef);
        return $firebaseArray(itemsRef);
    })
    .factory("Users", function ($firebaseArray) {
        var usersRef = new Firebase("https://datfeel.firebaseio.com/feelers");
        //console.log("Data", usersRef);
        return $firebaseArray(usersRef);
    })
    .factory('$localstorage', ['$window', function ($window) {
        return {
            set: function (key, value) {
                $window.localStorage[key] = value;
            },
            get: function (key, defaultValue) {
                return $window.localStorage[key] || defaultValue;
            },
            setObject: function (key, value) {
                $window.localStorage[key] = JSON.stringify(value);
            },
            getObject: function (key) {
                return JSON.parse($window.localStorage[key] || '{}');
            }
        }
    }
    ])
    .factory('Root', function ($rootScope) {
        return {
            checkLogin: function () {
                // Check if logged in and fire events
                if (this.isLoggedIn()) {
                    $rootScope.$broadcast('app.loggedIn');
                } else {
                    $rootScope.$broadcast('app.loggedOut');
                }
            },
            isLoggedIn: function () {
                // Check auth token here from localStorage
            },
            login: function (user, pass) {
                // Do the login
                // When done, trigger an event:
                $rootScope.$broadcast('app.loggedIn');
            },
            logout: function (user, pass) {
                // Same thing, log out user
                $rootScope.$broadcast('app.loggedOut');
            }
        }
    });