angular.module('app').controller('groupCreateCtrl', function($scope, $route, groupService, notifierService, identityService, userService) {
  var groupId = $route.current.params.id;
  $scope.group = {};
  if (groupId) {
    groupService.getGroup($route.current.params.id).$promise.then(function(data) {
      $scope.group = data;
      $scope.leaderIds = [];
      for (var i = 0; i < data.leaders.length; i++) {
        $scope.leaderIds.push(data.leaders[i]._id);
      }
    });
  } else {
    $scope.group.title = "";
    $scope.group.location = "";
    $scope.group.dayOfWeek = "";
    $scope.group.frequency = "";
    $scope.group.genderType = "";
    $scope.group.childcare = true;
    $scope.group.topics = [];
    $scope.group.description = "";
    $scope.leaderIds = [];
  }

  // if the current user is an admin then they have the ability to create a group
  // and assign the leader as another person otherwise the group leader will be
  // set to the person who creates the group
  if (identityService.isAdmin()) {
    userService.getUsers().$promise.then(function(data) {
      $scope.users = [];
      for (var i = 0; i < data.length; i++) {
        $scope.users[i] = {};
        $scope.users[i].name = data[i].firstName + " " + data[i].lastName;
        $scope.users[i]._id = data[i]._id;
      }
    });
    $scope.identity = identityService;
  }

  $scope.frequencies = [
    "Weekly",
    "Bi-weekly",
    "Monthly",
    "Various"
  ];
  $scope.genderTypes = [
    "Men",
    "Women",
    "Co-ed"
  ];
  $scope.daysOfTheWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ]
  $scope.availableTopics = [
    "Sports",
    "Book/bible study",
    "Food",
    "Discussion",
    "Hobby/interest(such as board games)",
    "Service",
    "Finance"
  ];

  $scope.saveGroup = function() {
    // if the form is valid then submit to the server
    if (groupCreateForm.checkValidity()) {
      if (identityService.isAdmin()) {
        $scope.group.leaders = [];
        for (var i = 0; i < $scope.leaderIds.length; i++) {
          $scope.group.leaders.push($scope.leaderIds[i]);
        }
      }
      groupService.saveGroup($scope.group).then(function() {
        if ($scope.group._id) {
          notifierService.notify('Group ' + $scope.group.title + ' has been updated');
        } else {
          notifierService.notify('Group ' + $scope.group.title + ' has been created');
        }
      }, function(reason) {
        notifierService.error(reason);
      })
    }
  }
});
