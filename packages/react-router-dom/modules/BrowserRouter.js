import React from "react";
import { Router } from "react-router";
import { createBrowserHistory as createHistory } from "history";
import PropTypes from "prop-types";
import warning from "tiny-warning";

/**
 * The public API for a <Router> that uses HTML5 history.
 * 对 Router 的简单封装，使用 createBrowserHistory 自动创建 history prop
 */
class BrowserRouter extends React.Component {
  history = createHistory(this.props);

  render() {
    return <Router history={this.history} children={this.props.children} />;
  }
}

if (__DEV__) {
  BrowserRouter.propTypes = {
    basename: PropTypes.string,
    children: PropTypes.node,
    forceRefresh: PropTypes.bool,
    getUserConfirmation: PropTypes.func,
    keyLength: PropTypes.number
  };

  BrowserRouter.prototype.componentDidMount = function() {
    warning(
      !this.props.history,
      "<BrowserRouter> ignores the history prop. To use a custom history, " +
        "use `import { Router }` instead of `import { BrowserRouter as Router }`."
    );
  };
}

export default BrowserRouter;
