var Group = require('mongoose').model('Group'),
  User = require('mongoose').model('User'),
  emailer = require('../utilities/emailer'),
  reportGenerator = require('../utilities/reportGenerator');

exports.emailGroupReportToSelf = function(req, res) {
  Group.find({}).populate('leaders').exec(function(err, collection) {
    var report = reportGenerator.createDailyReport(collection);
    emailer.sendGroupsReport(req.user);
    emailer.sendAuditMessageEMail(req.user.username + " requested an on demand daily report email");
  });
  return res.end();
};

exports.getGroups = function(req, res) {
  console.log("getGroups")
  Group.find({}).populate('leaders').exec(function(err, collection) {
    res.send(collection);
  });
};

exports.getGroup = function(req, res) {
  console.log("getGroup")
  var groupId = req.params.id;
  if (groupId) {
    console.log("finding one group")
    Group.findOne({_id: groupId}).populate('leaders').exec(function(err, group) {
      res.send(group);
    });
  }
};

exports.saveGroup = function(req, res, next) {
  console.log("saveGroup")
  var groupData = req.body;

  // if the leaderId is not set, or if this is not an admin user
  // then set the leaderId to the current user
  if (!groupData.leaders || groupData.leaders.length <= 0 || !req.user.hasRole('admin')) {
    groupData.leaders = [req.user._id];
  }

  Group.create(groupData, function(err, group) {
    if(err) {
      if(err.toString().indexOf('E11000') > -1) {
        err = new Error('There is already a group with that title.  Choose a different title.');
      }
      res.status(400);
      res.send({reason:err.toString()});
    } else {
      emailer.sendAuditMessageEMail("Group: " + groupData.title + " was created by: " + req.user.username);
      res.send(group);
    }
  })
};

exports.updateGroup = function(req, res) {
  console.log("updateGroup");

  var groupUpdates = req.body;
  var groupId = groupUpdates._id;
  delete groupUpdates["_id"];

  if(req.user.id !== groupUpdates.leaders[0] && !req.user.hasRole('admin')) {
    res.status(403);
    return res.end();
  }
  Group.findByIdAndUpdate(groupId, groupUpdates, undefined, function(err) {
    if(err) { res.status(400); return res.send({reason:err.toString()});}
    groupUpdates._id = groupId;
    emailer.sendAuditMessageEMail("Group: " + groupUpdates.title + " was updated by: " + req.user.username);
    res.send(groupUpdates);
  });
};

/**
 * Add a member to a group.  The member is stored in the group.newMember property and it
 * has the properties firstName, lastName, and email.
 *
 * Note: to remove all members from a group from the mongo command line, use the command:
 * db.groups.update({"title":"<group-title>"}, {$pull:{"members":{}}})
 *
 * @param req
 * @param res
 */
exports.addMember = function(req, res) {
  console.log("addMember");

  var memberData = req.body.newMember;
  memberData.status = "PENDING";
  memberData.joinDate = new Date();

  var groupId = req.params.id;

  Group.findOne({_id: groupId}).populate('leaders').exec(function(err, group) {
    if(err) { res.status(400); return res.send({reason:err.toString()});}
    group.members.push(memberData);
    group.save(function(err) {
      if(err) { res.status(400); return res.send({reason:err.toString()});}
      emailer.sendAddedMemberEMail(group, memberData);
      return res.end();
    });
  });
};

exports.deleteGroup = function(req, res) {
  // get the group object from the request body that is to be deleted
  var groupDeleteId = req.params.id;
  // only admins can delete groups
  if(!req.user.hasRole('admin')) {
    res.status(403);
    return res.end();
  }
  // if there was no group object in the request then return bad request
  else if (groupDeleteId === undefined) {
    res.status(400);
    return res.end();
  }
  // otherwise, get the group from the database then delete them
  else {
      Group.findById(groupDeleteId).exec(function(err, collection) {
      var groupToDelete = collection;

      // if not found then return 404
      if(err) {
        res.status(404);
        return res.send({reason: err.toString()});
      }
      // if found then delete
      else {
        groupToDelete.remove(function(err) {
          if(err) {
            res.status(400);
            return res.send({reason:err.toString()});
          }
          emailer.sendAuditMessageEMail("Group: " + groupToDelete.title + " was deleted by: " + req.user.username);
          return res.end();
        });
      }
    });
  }
};