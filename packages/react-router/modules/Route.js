import React from "react";
import { isValidElementType } from "react-is";
import PropTypes from "prop-types";
import invariant from "tiny-invariant";
import warning from "tiny-warning";

import RouterContext from "./RouterContext";
import matchPath from "./matchPath";

function isEmptyChildren(children) {
  return React.Children.count(children) === 0;
}

/**
 * The public API for matching a single path and rendering.
 * 这是 React-router 的核心
 */
class Route extends React.Component {
  render() {
    return (
      <RouterContext.Consumer>
        {context => {
          invariant(context, "You should not use <Route> outside a <Router>");

          const location = this.props.location || context.location;

          // 如果不 match，则返回 null
          const match = this.props.computedMatch // computedMatch 只会出现在 Switch 组件渲染中
            ? this.props.computedMatch // <Switch> already computed the match for us
            : this.props.path // 如果为 Route 组件传入了 path 属性，则会用 matchPath 计算 match，否则直接
                              // 使用 Provider 提供的 match 属性
              ? matchPath(location.pathname, this.props)
              : context.match;

          // 在利用 PureComponent 优化特性时需要注意：只要 Route 组件被 render，其 match prop 就是一个全新的对象
          // 这会绕过 PureComponent 的浅比较优化
          // https://github.com/ReactTraining/react-router/issues/5099
          const props = { ...context, location, match };

          let { children, component, render } = this.props;

          // Preact uses an empty array as children by
          // default, so use null if that's the case.
          if (Array.isArray(children) && children.length === 0) {
            children = null;
          }

          if (typeof children === "function") {
            children = children(props);

            if (children === undefined) {
              if (__DEV__) {
                const { path } = this.props;

                warning(
                  false,
                  "You returned `undefined` from the `children` function of " +
                    `<Route${path ? ` path="${path}"` : ""}>, but you ` +
                    "should have returned a React element or `null`"
                );
              }

              children = null;
            }
          }

          return (
            <RouterContext.Provider value={props}>
              {children && !isEmptyChildren(children)
                ? children // 如果 Route 组件有 children 则不管是否 match 都会渲染 children，
                           // 因为 children 有可能是嵌套的 Route
                : props.match
                  ? component
                    ? React.createElement(component, props)
                    : render
                      ? render(props)
                      : null
                  : null}
            </RouterContext.Provider>
          );
        }}
      </RouterContext.Consumer>
    );
  }
}

if (__DEV__) {
  Route.propTypes = {
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    component: (props, propName) => {
      if (props[propName] && !isValidElementType(props[propName])) {
        return new Error(
          `Invalid prop 'component' supplied to 'Route': the prop is not a valid React component`
        );
      }
    },
    exact: PropTypes.bool,
    location: PropTypes.object,
    path: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]),
    render: PropTypes.func,
    sensitive: PropTypes.bool,
    strict: PropTypes.bool
  };

  Route.prototype.componentDidMount = function() {
    warning(
      !(
        this.props.children &&
        !isEmptyChildren(this.props.children) &&
        this.props.component
      ),
      "You should not use <Route component> and <Route children> in the same route; <Route component> will be ignored"
    );

    warning(
      !(
        this.props.children &&
        !isEmptyChildren(this.props.children) &&
        this.props.render
      ),
      "You should not use <Route render> and <Route children> in the same route; <Route render> will be ignored"
    );

    warning(
      !(this.props.component && this.props.render),
      "You should not use <Route component> and <Route render> in the same route; <Route render> will be ignored"
    );
  };

  Route.prototype.componentDidUpdate = function(prevProps) {
    warning(
      !(this.props.location && !prevProps.location),
      '<Route> elements should not change from uncontrolled to controlled (or vice versa). You initially used no "location" prop and then provided one on a subsequent render.'
    );

    warning(
      !(!this.props.location && prevProps.location),
      '<Route> elements should not change from controlled to uncontrolled (or vice versa). You provided a "location" prop initially but omitted it on a subsequent render.'
    );
  };
}

export default Route;
