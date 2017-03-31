import React from 'react';
import { Field, reduxForm } from 'redux-form';

const validate = values => {
    const errors = {};
    if (!values.username) {
        errors.username = 'Required';
    }
    if (!values.password) {
        errors.password = 'Required';
    }


    return errors;
};

const LoginForm = (props) => {
    const { handleSubmit, pristine, submitting, invalid} = props;
    console.log('errors', props);
    return (
        <div className="container">
            <div className="well">
                <form name="loginForm" className="form-horizontal" onSubmit={handleSubmit}>
                    <fieldset>
                        <legend>Log In</legend>
                        <div className="form-group">
                            <label htmlFor="username" className="col-md-2 control-label">Username (Email)</label>
                            <div className="col-md-10">
                                <Field component="input" name="username" type="email" placeholder="Username (Email)" required="required" autoComplete="off" className="form-control " />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="password" className="col-md-2 control-label">Password</label>
                            <div className="col-md-10">
                                <Field component="input" name="password" type="password" placeholder="Password" required="required" autoComplete="off" className="form-control " />
                            </div>
                        </div>
                        <div className="form-group">
                            <div className="col-md-10 col-md-offset-2">
                                <div className="pull-right">
                                    <button type="submit" disabled={pristine || invalid || submitting} className="btn btn-primary">Log In</button>
                                    <a href="/" className="btn btn-default">Cancel</a>
                                </div>
                            </div>
                        </div>
                    </fieldset>
                </form>
            </div>
        </div>
    );
};
export default reduxForm({
    form: 'login',  // a unique identifier for this form
    validate
})(LoginForm);