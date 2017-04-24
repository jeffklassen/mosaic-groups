var logger = require('../config/logger');
var hash = require('ys-hash');
var config = require('../config/config');
var json2csv = require('json2csv');

exports.generateDistinctUsersReport = function (Groups, callback) {
    var allMembers = [];
    var fields = ['first', 'last'];
    Groups.aggregate()
        //we dont want to include disabled groups
        .match({
            disabled: false
        })
        //explode all groups by member
        .unwind('members')
        // this is what makes the returned list unique.
        .group({
            _id: {
                last: {
                    $toLower: '$members.lastName'
                },
                first: {
                    $toLower: '$members.firstName'
                },

            }
        })
        //sort by last then first
        .sort({
            '_id.last': 1,
            '_id.first': 1
        })
        // do something with the results
        .exec(function (err, members) {


            members.forEach(function (member) {
                allMembers.push(member._id);
            });
            //console.log(allMembers);

            json2csv({
                data: allMembers,
                fields: fields
            }, function (err, csv) {
                if (err) logger.log(err);
                callback(csv);
            });
        });
};

exports.createDailyReport = function (groups) {
    var today = new Date();
    var yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    var numMembers = 0;
    var numNewMembers = 0;
    var numUniqueMembers = 0;
    var reportHtml = '',
        membersHtml = '';
    var uniqueMembers = [];

    reportHtml += '<h3>Mosaic Groups Daily Report for ' + today.toDateString() + '</h3>';

    membersHtml += '<ul>';
    for (var i = 0; i < groups.length; i++) {
        var group = groups[i];
        membersHtml += '<li>';
        if (group.members.length >= group.memberLimit) {
            membersHtml += '<b>(FULL)</b> ';
        }
        membersHtml += '<b>\'' + group.title + '\'</b> on ' + group.dayOfTheWeek + ' in ' + group.location;
        membersHtml += ' with <b>' + group.members.length + ' members</b>';
        membersHtml += ' lead by: ';
        for (let j = 0; j < group.leaders.length; j++) {
            var leader = group.leaders[j];
            membersHtml += leader.firstName + ' ' + leader.lastName + ' &lt;' + leader.username + '&gt; ';
            if (j + 1 < group.leaders.length) membersHtml += ', ';
        }
        membersHtml += '</li>';

        membersHtml += '<ul>';
        for (let j = 0; j < group.members.length; j++) {
            numMembers++;
            var member = groups[i].members[j];
            var memberHashStr = generateUniqueMemberId(member);
            if (uniqueMembers.indexOf(memberHashStr) < 0) {
                uniqueMembers.push(memberHashStr);
                numUniqueMembers++;
            }
            var joinDate;
            try {
                joinDate = member.joinDate.toDateString();
            } catch (err) {
                joinDate = '<span  style=\'color:red\'><b> -ERROR getting join date value is: \'' + member.joinDate + '\'- </b></span>';
            }
            var memberHtml = member.firstName + ' ' + member.lastName + ' &lt;' + member.email + '&gt; joined on ' + joinDate + '</li>';
            if (member.joinDate > yesterday) {
                numNewMembers++;
                membersHtml += '<li style=\'color:green\'><b>' + memberHtml + '</b></li>';
            } else {
                membersHtml += '<li>' + memberHtml + '</li>';
            }
        }
        membersHtml += '</ul>';
    }
    membersHtml += '</ul>';
    reportHtml +=
    '<p>' +
    '<div>There are <b>' + numMembers + '</b> members total signed up for growth groups</div>' +
    '<div>There are <b>' + numUniqueMembers + ' unique</b> members signed up for growth groups</div>' +
    '<div>There were <span style=\'color:green\'><b>' + numNewMembers + '</b></span> new members total in the past 24hours (highlighted in <span style=\'color:green\'><b>green</b></span> below)</div>' +
    '</p>';
    reportHtml += membersHtml;
    return reportHtml;
};

var generateUniqueMemberId = function (member) {
    var uniqueString = member.firstName.trim().toLowerCase() + member.lastName.trim().toLowerCase() + member.email.trim().toLowerCase();
    var memberHashStr = hash.hash_str(uniqueString);
    return memberHashStr;
};