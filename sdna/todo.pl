:- dynamic flow_sate/3.
:- dynamic triple/3.
:- dynamic instance_decoration_shape/3.

register_sdna_flow("TODO", t).
flowable(_, t).

flow_state(ExprAddr, 0, t) :- triple(ExprAddr, "todo://state", "todo://ready").
flow_state(ExprAddr, 0.5, t) :- triple(ExprAddr, "todo://state", "todo://doing").
flow_state(ExprAddr, 1, t) :- triple(ExprAddr, "todo://state", "todo://done").

start_action('[{action: "addLink", source: "this", predicate: "todo://state", target: "todo://ready"}]', t).
action(0, "Start", 0.5, '[{action: "addLink", source: "this", predicate: "todo://state", target: "todo://doing"}, {action: "removeLink", source: "this", predicate: "todo://state", target: "todo://ready"}]').
action(0.5, "Finish", 1, '[{action: "addLink", source: "this", predicate: "todo://state", target: "todo://done"}, {action: "removeLink", source: "this", predicate: "todo://state", target: "todo://doing"}]').

register_ontology_class("Todo", c).
instantiate_class(c, '[{action: "addLink", source: "this", predicate: "todo://state", target: "todo://ready"}]').
class_check(c, X) :- triple(X, "todo://state", _).
class_color(c, "#FF0000").
instance_color(c, X, "#FFFF00") :- flow_state(X, 0.5, t).
instance_color(c, X, "#00FF00") :- flow_state(X, 1, t).
class_decoration_shape(c, "circle").
instance_decoration_shape(c, _, S) :- class_decoration_shape(c, S).

hiddenExpression("todo://ready").
hiddenExpression("todo://doing").
hiddenExpression("todo://done").
