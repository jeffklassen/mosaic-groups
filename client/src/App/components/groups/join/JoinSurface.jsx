import React from 'react';
import { connect } from 'react-redux';
import { fetchUsersIfNeeded } from '../../../actions/users';
import { fetchGroupsIfNeeded } from '../../../actions/groups';
import { Jumbotron, Row, Col } from 'react-bootstrap';
import DescriptionWell from './DescriptionWell.jsx';

class JoinSurface extends React.Component {
    constructor(props) {
        super(props);
    }
    componentWillMount() {
        const { dispatch } = this.props;
        dispatch(fetchUsersIfNeeded());
        dispatch(fetchGroupsIfNeeded());
    }
    render() {
        let { group } = this.props;
        if (group.title) {
            return (
                <div className="container">
                    <Jumbotron>
                        <h1>{group.title}</h1>
                    </Jumbotron>
                    <Row>
                        <Col md={6}>
                        <DescriptionWell group={group} />
                        </Col>
                    </Row>
                </div>
            );
        }
        else {
            return <span>loading...</span>;
        }

    }
}

const mapStateToProps = (state, ownProps) => {
    const groupId = ownProps.match.params.id || '';

    let matchingGroups = [];
    if (state.groups.groups) {
        matchingGroups = state.groups.groups.filter(group => group._id == groupId);
    }

    let group;
    if (matchingGroups.length === 1) {
        group = matchingGroups[0];
    }
    else {
        group = {};
    }
    return {
        group,
        users: state.users.users || [],
        identity: state.identity
    };
};
export default connect(mapStateToProps)(JoinSurface);