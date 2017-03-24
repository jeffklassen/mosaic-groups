let request = require('supertest');
let session = require('supertest-session');
let expect = require('expect.js');
let app = require('./common').app;

let groupService = require('../../server/services/groupsService');
let Group = require('mongoose').model('Group');

describe('Groups Manipulation', function () {
    let groups = [];
    let group = {
        title: 'testG',
        memberLimit: 15,
        location: 'my house',
        dayOfTheWeek: 'Mon',
        meetingTime: '6 AM',
        audienceType: 'zombies',
        description: 'test description',
    };
    it('Should add a new group', function (done) {
        groupService.saveGroup(group, function (err, g) {
            if (err) throw err;
            expect(g.title).to.equal('testG');
            groups.push(g);
            done();
        });

    });
    it('Should add a second new group', function (done) {
        group.title = 'test2';
        groupService.saveGroup(group, function (err, g) {
            if (err) throw err;
            expect(g.title).to.equal('test2');
            groups.push(g);
            done();
        });

    });
    it('Should contain two groups', function (done) {
        request(app)
            .get('/api/groups/')
            .expect(200)
            .end(function (err, res) {
                if (err) throw err;
                expect(res.body.length).to.equal(2);
                done();
            });
    });
    it('Should not add a new group', function (done) {
        group.title = undefined;
        groupService.saveGroup(group, function (err, g) {
            expect(err.name).to.be('ValidationError');
            expect(g).to.be(undefined);
            done();
        });
    });
    
});

describe('Anthenticated Group Member Manipulation', function () {

    let coupleGroup = {
        title: 'couplesgroup',
        memberLimit: 3,
        location: 'my house',
        dayOfTheWeek: 'Mon',
        meetingTime: '6 AM',
        audienceType: 'Couples',
        description: 'test description',
    };
    let group2 = Object.assign({}, coupleGroup, { title: 'group2' });
    let group3 = Object.assign({}, coupleGroup, { title: 'group3' });
    let member = {
        firstName: 'Little Bobby',
        lastName: 'Jones',
        email: 'lilbobby@isp.test2',
        phone: '1112223333',
        preferContactVia: 'phone',
    };


    before(function (done) {
        groupService.saveGroup(coupleGroup, function (err, group) {
            if (err) throw err;

            coupleGroup._id = group._id;
            groupService.saveGroup(group2, function (err, group) {
                group2._id = group._id;
                groupService.saveGroup(group3, function (err, group) {
                    group3._id = group._id;
                    done();
                });
            });

        });
    });


    it('Should add 2 members', function (done) {
        request(app)
            .post(`/api/groups/${coupleGroup._id}/add-member`)
            .send({ newMember: member, newMemberSpouse: member })
            .expect(200)
            .end(function (err, res) {
                if (err) throw err;

                expect(res.body.success).to.equal(true);
                done();
            });
    });

    it('should fail if same emails signs up for more than 2 groups', function (done) {
        request(app)
            .post(`/api/groups/${group2._id}/add-member`)
            .send({ newMember: member })
            .expect(200)
            .end(function (err, res) {
                if (err) throw err;
                request(app)
                    .post(`/api/groups/${group3._id}/add-member`)
                    .send({ newMember: member })
                    .expect(400)
                    .end(function (err, res) {
                        if (err) throw err;
                        expect(res.body.success).to.equal(undefined);
                        done();

                    });
            });
    });

});

describe('Group Member Schema Testing', function() {

    let group = {
        title: 'Generic Group',
        memberLimit: 15,
        location: 'Merryland',
        dayOfTheWeek: 'Mon',
        meetingTime: '6 AM',
        audienceType: 'People',
        description: 'The most generic of all groups',
    };
    
    let member = {
        firstName: 'Boring Bobby',
        lastName: 'Barrington',
        email: 'boringbobby@isp.limo',
        phone: '5554445555',
        preferContactVia: 'phone',
    };
    
    it('Should fail on missing member phone', () => {
        
        let noPhoneMember = Object.assign({},member);
        noPhoneMember.username = 'nophone@email.com';
        delete noPhoneMember.phone;

        let phoneGroup = Object.assign({}, group);
        phoneGroup.members = [noPhoneMember];
        
        Group.create(phoneGroup)
        .then(
            () => { expect().fail('Member Validation should have failed');},
            (err) => { expect(err.name).to.be('ValidationError');}
        );      
    });
    
    it('Should fail on missing member preferred contact method', () => {
        
        let noContactMember = Object.assign({},member);
        noContactMember.username = 'nocontact@email.com';
        delete noContactMember.preferContactVia;

        let contactGroup = Object.assign({}, group);
        contactGroup.members = [noContactMember];
        
        Group.create(contactGroup)
        .then(
            () => { expect().fail('Member Validation should have failed');},
            (err) => { expect(err.name).to.be('ValidationError');}
        );      
    });
         
    let emergency_contact = {
        firstName: 'Concerned',
        lastName: 'Parent',
        email: 'helicopter@parent.com',
        phone: '5556667777',
    };
    
    it('Add a student group member with emergency contact', () => {
        
        let goodStudentMember = Object.assign({},member);
        goodStudentMember.username = 'goodStudent@email.com';
        goodStudentMember.emergency_contact = emergency_contact;

        let goodStudentGroup = Object.assign({}, group);
        goodStudentGroup.members = [goodStudentMember];
        
        Group.create(goodStudentGroup)
        .then(
            (g) => {expect(g.members[0].emergency_contact.firstName).to.equal('Concerned');},
            (err) => { expect().fail('Failed to Add Student Member');}
        );      
    }); 
    
    it('not add a student group member with a broken emergency contact', () => {
        
        let badContactMember = Object.assign({},member);
        badContactMember.username = 'badcontact@email.com';
            
        let badEmergencyContact = Object.assign({}, emergency_contact);
        badContactMember.emergency_contact = badEmergencyContact;
        
        let badContactGroup = Object.assign({}, group);
        badContactGroup.members = [badContactMember];
        
        Group.create(badContactGroup)
        .then(
            () => { expect().fail('Member Validation should have failed');},
            (err) => { expect(err.name).to.be('ValidationError');}
        );      
    });
    
});
    
describe('Anthenticated Group Manipulation', function () {
    let unauthSession, authSession;
    beforeEach(function () {
        unauthSession = session(app);
    });

    it('Unauthenticated user cannot delete a group', function (done) {
        unauthSession
            .get('/api/groups/')
            .expect(200)
            .end(function (err, res) {

                unauthSession
                    .delete(`/api/groups/${res.body[1]._id}`)
                    .expect(403)
                    .end(function () {

                        done();
                    });
            });
    });

    it('User should authenticate', function (done) {
        unauthSession
            .post('/login/')
            .send({ username: 'pblair12@gmail.com', password: 'p' })
            .expect(200)
            .end(function (err, res) {
                expect(res.body.user.username).to.equal('pblair12@gmail.com');
                authSession = unauthSession;
                done();

            });
    });

    it('Authenticated user can delete a group', function (done) {

        authSession
            .get('/api/groups/')
            .expect(200)
            .end(function (err, res) {

                authSession
                    .delete(`/api/groups/${res.body[1]._id}`)
                    .expect(200)
                    .end(function (deleteErr, deleteRes) {
                        //console.log(deleteRes);
                        expect(deleteRes.statusCode).to.equal(200);

                        done();
                    });
            });
    });

    it('Authenticated user can update a group', function (done) {

        authSession
            .get('/api/groups/')
            .expect(200)
            .end(function (err, res) {

                authSession
                    .post(`/api/groups/${res.body[1]._id}`)
                    .send({ title: 'fooy' })
                    .expect(200)
                    .end(function (updateErr, updateRes) {
                        expect(updateRes.statusCode).to.equal(200);
                        expect(updateRes.body.title).to.equal('fooy');

                        done();
                    });
            });
    });

});
/*
var g1ID, g2ID, g3ID;

async.series([
    function (outercallback) {
        describe('Groups Model', function () {
            var group = {
                title: 'testG',
                memberLimit: 15,
                location: 'my house',
                dayOfTheWeek: 'Mon',
                meetingTime: '6 AM',
                audienceType: 'zombies',
                description: 'test description',
            };

            var studentMember = {
                firstName: 'Little Bobby',
                lastName: 'Jones',
                email: 'lilbobby@isp.test',
                phone: '1112223333',
                status: 'PENDING',
                joinDate: new Date(),
                emergency_contact: {
                    firstName: 'Concerned',
                    lastName: 'Parent',
                    email: 'helicopter@parent.com',
                    phone: '5556667777',
                }
            };

            it('Should add a new group', function (done) {
                Group.create(group, function (err, g) {
                    if (err) throw err;
                    expect(g.title).to.equal('testG');
                    g1ID = g._id;
                    done();
                });

            });

            it('Should not add a new group', function (done) {
                group.title = undefined;
                Group.create(group, function (err, g) {
                    expect(err.name).to.be('ValidationError');
                    expect(g).to.be(undefined)
                    done();
                });
            });

            it('Should contain 3 groups', function (done) {
                async.series([
                    function (callback2) {
                        group.title = 'testg2';

                        Group.create(group, function (err, g) {
                            if (err) throw err;
                            g2ID = g._id;
                            expect(g.title).to.equal('testg2');
                            callback2();
                        });
                    },
                    function (callback2) {
                        group.title = 'testg3';
                        groupService.saveGroup(group, function (err, g) {
                            if (err) throw err;
                            g3ID = g._id;
                            expect(g.title).to.equal('testg3');
                            callback2();
                        });
                    },
                    function (callback2) {
                        request(app)
                            .get('/api/groups/')
                            .expect(200)
                            .end(function (err, res) {
                                if (err) throw err;
                                expect(res.body.length).to.equal(3);
                                callback2();
                            });
                    }
                ], function (err, results) {
                    if (err) throw err;
                    done();
                    outercallback();
                });

            });

            it('Should Add a Group with Emergency Contact', function (done) {
                group.title = 'sGroup' //Fix from previous test that breaks group
                group.members = [studentMember]
                Group.create(group, function (err, g) {
                    if (err) throw err;
                    expect(g.members[0].emergency_contact.firstName).to.equal('Concerned');
                    done();
                });
            });

            it('Shouldn not add Broken Contact', function (done) {
                group.members[0].firstName = undefined;
                Group.create(group, function (err, g) {
                    expect(err.name).to.be('ValidationError');
                    done();
                });
            });

        });
        describe('Groups Routes', function () {
            var user = {};
            before(function (beforeCompleted) {

                user.firstName = 'test';
                user.lastName = 'user';
                user.email = 'user@user.com';
                async.series([
                    function (callback2) {
                        request(app)
                            .post('/api/groups/' + g1ID + '/add-member')
                            .send({ newMember: user })
                            .expect(200)
                            .end(function (err, res) {
                                if (err) throw err;
                                callback2();
                            });

                    },
                    function (callback2) {
                        request(app)
                            .post('/api/groups/' + g2ID + '/add-member')
                            .send({ newMember: user })
                            .expect(200)
                            .end(function (err, res) {
                                if (err) throw err;
                                callback2();
                            });

                    },
                    function (callback2) {
                        request(app)
                            .post('/api/groups/' + g3ID + '/add-member')
                            .send({ newMember: user })
                            .expect(200)
                            .end(function (err, res) {
                                expect(err).to.not.be(undefined);
                                //if (err) throw err;
                                callback2();
                            });

                    }
                ], function () {
                    beforeCompleted();
                });
            });

            it('Should contain one member', function (done) {
                request(app)
                    .get('/api/groups/' + g1ID)
                    .expect(200)
                    .end(function (err, res) {
                        if (err) throw err;
                        done();
                    });
            });

            it('Should contain 0 members', function (done) {
                request(app)
                    .get('/api/groups/' + g3ID)
                    .expect(200)
                    .end(function (err, res) {
                        if (err) throw err;
                        expect(res.body.members.length).to.equal(0);
                        done(err);
                    });
            });
        });
    }
]);

*/