# Category flow review

AC-PROD-08-1: inspected the route/controller/service AST inventory and source. Both GET routes delegate to the controller, which awaits the service and uses the standard success envelope or forwards errors. `listCategories` queries only `isActive: true`, projects the baseline list fields and sorts `{ name: 1 }`. `getCategoryBySlug` queries the literal slug together with `isActive: true`; a missing result throws the fixed Vietnamese 404. Database failures reach the safe shared error handler.

Six Jest scenarios exercise query contracts and HTTP behavior. Five further scenarios against disposable MongoDB provide 12 assertions for actual ordering, exclusion of inactive data, projection, active/unknown/inactive slug behavior and empty results. Categories remain public and the schema is unchanged. ESLint/SonarJS complexity and nesting checks pass. The bounded inventory is not a calibrated semantic evaluator; automatic completion remains inconclusive.
