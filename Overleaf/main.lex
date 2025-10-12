\documentclass[12pt,a4paper]{article}
\usepackage{amsmath, amssymb, amsthm}
\usepackage{geometry}
\geometry{margin=1in}
\usepackage{setspace}
\setstretch{1.2}

\title{Cover Shelter Design}
\author{Mehmet Melikşah Çalışkan \and Cemal Bolat}
\date{October 2025}

\begin{document}

\maketitle

\section{Input Variables}

The following sets and parameters are defined as input data to the model:

\begin{itemize}
    \item $V$: Set of vertices (available container locations).
    \item $T$: Set of container types.
    \item $r \in T$: Residential container type.
    \item $D_t$: Distance limit for non-residential type $t \in T \setminus \{r\}$.
    \item $d(u,v)$: Distance between the vertices $u,v \in V$ calculated by Manhattan shortest path algorithm.
    \item $h(u,v)$: Distance between the vertices $u,v \in V$ calculated by hypotenuse between the positions of the vertices. 
    \item $Demand_t$: Maximum number of residential vertices that can be covered by a container of type $t \in T \setminus \{r\}$.

\end{itemize}

The neighborhood for each vertex and type is defined as:
\[
S_{v,t} = \{\, u \in V \mid u \neq v \text{ and } d(u,v) \le D_t \,\}, 
\quad \forall v \in V, \forall t \in T \setminus \{r\}.
\]

\textbf{Explanation:}  
The input variables define the problem structure. $V$ and $T$ describe the possible positions and container types, while $D_t$ , $d(u,v)$ and $h(u,v)$ specify spatial relationships between containers.

\section{Decision Variables}

\[
X_{v,t} =
\begin{cases}
1, & \text{if vertex } v \in V \text{ is assigned container type } t \in T,\\[4pt]
0, & \text{otherwise.}
\end{cases}
\quad \forall v \in V, \forall t \in T.
\]

\textbf{Explanation:}  
The binary decision variable $X_{v,t}$ determines whether the vertex $v$ is used for container type $t$.  
Each vertex can have at most one type assigned.

\[
Z_{u,v,t} = 
\begin{cases}
1, & \text {if $x_{u,t}$ = 1 and $x_{v,t}$ = 1} \\[4pt]
0, & \text{otherwise.}
\end{cases}
\quad \forall u, v \in V \; with \;\; u < v, \; \forall t \in T \setminus \{r\} 
\]

\textbf{Explanation:}
The binary decision variable $Z_{u,v,t}$ determines whether the vertex $u$ and $v$ are of both same type $t$. 
This decision variable is used to minimize the distance between same type vertices.

\section{Objective Function}

Maximize the total number of residential containers:
\[
\max (\sum_{v \in V} X_{v,r} - \lambda \sum_{t \in T \setminus \{r\}} \sum_{u<v} h(u,v)\;Z_{u,v,t})
\]

\textbf{Explanation:}  
The objective aims to maximize the number of residential-type containers placed while minimizing the distance between vertices with the same container type with respect to all spatial and coverage constraints. $\lambda$ is a variable between 0-1 determines that the effect of minimizing over maximizing residential-type containers

\section{Constraints}

\begin{enumerate}
    \item \textbf{Single Type Assignment:}
    \[
    \sum_{t \in T} X_{v,t} \le 1 \quad \forall v \in V.
    \]
    Each vertex can host at most one container type.

    \item \textbf{Neighborhood Coverage (Rainbow Constraint):}
    \[
    \sum_{u \in S_{v,t}} X_{u,t} \ge X_{v,r} \quad \forall v \in V, \forall t \in T \setminus \{r\}.
    \]
    If a vertex $v$ is residential, it must have at least one neighboring vertex of each non-residential type within distance $D_t$.

    \item \textbf{Binary Decision Variables:}
    \[
    X_{v,t} \in \{0, 1\} \quad \forall v \in V, \forall t \in T.
    \]

    \[
    Z_{u,v,t} \in \{0, 1\} \quad \forall u, v \in V, \forall t \in T \setminus \{r\}.
    \]
    
    All decisions are binary.

    \item \textbf{Linearization Of Multiplication}

    \[
    Z_{u,v,t} \leq X_{u,t},
    \]
    \[
    Z_{u,v,t} \leq X_{v,t}, 
    \]
    \[
    Z_{u,v,t} \geq X_{u,t} + X_{v,t} - 1
    \]
    \[
    \forall u < v \in V, \forall t \in T \setminus \{r\}
    \]
    
    If both $X_{u,t}$ and $X_{v,t}$ are equal to 1, that means that both vertices are container type $t$

    \item \textbf{Demand Constraint:} \\
    Each container of type $t \in T \setminus \{r\}$ can cover at most $Demand_t$ residential vertices:
    \[
    \sum_{u \in S_{v,t}} X_{u,r} \le Demand_t + M_v (1 - X_{v,t}) \quad \forall v \in V, \forall t \in T \setminus \{r\}
    \]
    where $M_v = |S_{v,t}|$ is a big-M constant to relax the constraint if $v$ is not assigned type $t$.
\end{enumerate}

\textbf{Explanation:}  
These constraints ensure logical feasibility:  
(1) no vertex hosts multiple containers,  
(2) residential areas are supported by diverse neighboring types, 
(3) variables are strictly binary, and  
(4) checking that multiple vertex type is linearized.
(5) ensures that each container of type $t$ can cover at most $Demand_t$ residential vertices.

\end{document}
