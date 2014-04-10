angular.module('app').controller('groupListCtrl', function($scope, $location, $filter, $q, $modal, ngTableParams, genderTypes, daysOfTheWeek, availableTopics, groupService, identityService, notifierService, settingsService) {
  $scope.identityService = identityService;
  $scope.data = undefined;

  $scope.genderTypes = angular.copy(genderTypes, $scope.genderTypes);
  $scope.genderTypes.unshift("");
  $scope.genderTypesFilter = $scope.genderTypes[0];

  $scope.daysOfTheWeek = angular.copy(daysOfTheWeek, $scope.daysOfTheWeek)
  $scope.daysOfTheWeek.unshift("");
  $scope.dayOfTheWeekFilter = $scope.daysOfTheWeek[0];

  $scope.availableTopics = angular.copy(availableTopics, $scope.availableTopics);
  $scope.availableTopics.unshift("");
  $scope.topicsFilter = $scope.availableTopics[0];

  $scope.childcareTypes = [
    {label:"", value:""},
    {label: "yes", value: true},
    {label: "no", value: false}
  ];
  $scope.childcareFilter = $scope.childcareTypes[0];

  $scope.settings = {
    disableGroups: true
  };

  $scope.tableFilter = {};
  $scope.tableFilterStrict = {};
  $scope.updateFilter = function(filterName, filterValue) {
    if (filterValue === "" || filterValue === "ALL" || filterValue === "EITHER") {
      delete $scope.tableFilter[filterName];
      delete $scope.tableFilterStrict[filterName];
    }
    else if (filterName === "dayOfTheWeek" || filterName === "genderType" || filterName === "childcare" || filterName === "topics") {
      $scope.tableFilterStrict[filterName] = filterValue;
    }
    else {
      $scope.tableFilter[filterName] = filterValue;
    }
    $scope.tableParams.reload();
  }

  $scope.tableParams = new ngTableParams({
    page: 1,            // show first page
    count: 100,          // count per page
    sorting:
      function(data) {
        switch(data.dayOfTheWeek) {
          case "Sunday":
            return 1 + data.title; break;
          case "Monday":
            return 2 + data.title; break;
          case "Tuesday":
            return 3 + data.title; break;
          case "Wednesday":
            return 4 + data.title; break;
          case "Thursday":
            return 5 + data.title; break;
          case "Friday":
            return 6 + data.title; break;
          case "Saturday":
            return 7 + data.title; break;
      }
    }
  }, {
    counts: [],
    total: 0, // length of $scope.groups
    groupBy: 'dayOfTheWeek',
    getData: function($defer, params) {
      groupService.getGroups().$promise.then(function(data) {
        $scope.data = data;
        params.total(data.total);

        // apply sorting
        var orderedData = params.sorting() ?
          $filter('orderBy')(data, $scope.tableParams.sorting()) :
          data;

        // apply filtering/searching based on any text in the given column
        orderedData = params.filter() ?
          $filter('filter')(orderedData, $scope.tableFilter, "false") :
          orderedData;
        // apply the strict filters
        orderedData = params.filter() ?
          $filter('filter')(orderedData, $scope.tableFilterStrict, function(a, e) {return a === e}):
          orderedData;
        $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
      });
    }
  });

  $scope.joinGroup = function(group) {
    $location.path('/views/groupJoin/group-join/' + group._id);
  }

  $scope.editGroup = function(group) {
    $location.path('/views/groupCreateOrEdit/group-create-or-edit/' + group._id);
  }

  $scope.deleteGroup = function(group) {
    $scope.group = group;

    var modalInstance = $modal.open({
      templateUrl: '/partials/groupList/confirm-delete-group-modal',
      controller: confirmDeleteGroupCtrl,
      resolve: {
        group: function () {
          return $scope.group;
        },
        tableParams: function() {
          return $scope.tableParams;
        }
      }
    });
  }

  $scope.canEdit = function(group) {
    var canEditGroup = false;
    if (!identityService.isAuthenticated()) {
      canEditGroup = false;
    }
    else if (identityService.isAdmin()) {
      canEditGroup = true;
    }
    else if ($scope.userIsLeaderOfGroup(identityService.currentUser, group)) {
      canEditGroup = true;
    }
    return canEditGroup;
  }

  $scope.groupIsFull = function(group) {
    return group.members.length >= group.memberLimit
  }

  $scope.userIsLeaderOfGroup = function(user, group) {
    var canEditGroup = false;
    for (var i = 0; i < group.leaders.length; i++) {
      var leader = group.leaders[i];
      if (user._id === leader._id) {
        canEditGroup = true;
      }
    }
    return canEditGroup;
  }

  $scope.emailGroupReportToSelf = function() {
    groupService.emailGroupReportToSelf().$promise.then(function() {
      notifierService.notify('Group Report email sent');
      $scope.tableParams.reload();
    }, function(reason) {
      notifierService.error(reason);
    });
  }

  $scope.getSettings = function() {
    settingsService.getSettings().$promise.then(function(data) {
      $scope.settings = data;
    }, function(reason) {
      notifierService.error(reason);
    });
  }

  $scope.disableGroups = function(disable) {
    var settings = {};
    angular.copy($scope.settings, settings);
    settings.disableGroups = disable;
    settingsService.saveSettings(settings).then(function(data){
      $scope.settings = data;
    }, function(reason) {
      notifierService.error(reason);
    });
  };

  $scope.groupsDisabled = function() {
    return $scope.settings.disableGroups;
  };

  var inArray = Array.prototype.indexOf ?
    function (val, arr) {
      return arr.indexOf(val)
    } :
    function (val, arr) {
      var i = arr.length;
      while (i--) {
        if (arr[i] === val) return i;
      }
      return -1;
    }

  $scope.getSettings();
});

var confirmDeleteGroupCtrl = function($scope, $modalInstance, groupService, notifierService, group, tableParams) {
  $scope.group = group;
  $scope.tableParams = tableParams;

  $scope.confirm = function () {
    groupService.deleteGroup(group).then(function() {
      notifierService.notify('Group \'' + group.title + '\' has been deleted');
      $scope.tableParams.reload();
    }, function(reason) {
      notifierService.error(reason);
    });

    $modalInstance.close();
  };

  $scope.cancel = function () {
    $modalInstance.close();
  };
}