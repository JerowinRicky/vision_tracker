"""
Kalman Filter for Object Tracking (ByteTrack / BoT-SORT state estimation).
Tracks bounding box state: [x, y, a, h, vx, vy, va, vh]
where (x, y) is bounding box center, a is aspect ratio (w/h), h is height,
and (vx, vy, va, vh) are respective velocities.
"""

import numpy as np


class KalmanBoxTracker:
    count = 0

    def __init__(self, bbox):
        """
        Initialises a tracker using initial bounding box: [x1, y1, x2, y2].
        """
        # State vector: [x, y, a, h, vx, vy, va, vh]
        self.dim_z = 4
        self.dim_x = 8

        self.x = np.zeros((8, 1))
        # Initial measurement
        w = max(1.0, float(bbox[2] - bbox[0]))
        h = max(1.0, float(bbox[3] - bbox[1]))
        x = float(bbox[0]) + w / 2.0
        y = float(bbox[1]) + h / 2.0
        a = w / h

        self.x[:4] = np.array([[x], [y], [a], [h]])

        # State transition matrix F
        self.F = np.eye(8)
        for i in range(4):
            self.F[i, i + 4] = 1.0

        # Measurement matrix H
        self.H = np.zeros((4, 8))
        self.H[:4, :4] = np.eye(4)

        # Covariance matrices
        self.P = np.eye(8) * 10.0
        self.P[4:, 4:] *= 1000.0  # high uncertainty on initial velocities

        self.R = np.eye(4) * 1.0  # measurement noise
        self.R[2, 2] *= 10.0

        self.Q = np.eye(8) * 0.01  # process noise
        self.Q[4:, 4:] *= 0.01

        self.time_since_update = 0
        self.id = KalmanBoxTracker.count
        KalmanBoxTracker.count += 1
        self.history = []
        self.hits = 1
        self.hit_streak = 1
        self.age = 0

    def update(self, bbox):
        """
        Updates the state vector with observed bbox: [x1, y1, x2, y2].
        """
        self.time_since_update = 0
        self.history = []
        self.hits += 1
        self.hit_streak += 1

        w = max(1.0, float(bbox[2] - bbox[0]))
        h = max(1.0, float(bbox[3] - bbox[1]))
        x = float(bbox[0]) + w / 2.0
        y = float(bbox[1]) + h / 2.0
        a = w / h

        z = np.array([[x], [y], [a], [h]])

        # Innovation
        y_tilde = z - np.dot(self.H, self.x)
        S = np.dot(self.H, np.dot(self.P, self.H.T)) + self.R
        K = np.dot(np.dot(self.P, self.H.T), np.linalg.inv(S))

        # New state and covariance
        self.x = self.x + np.dot(K, y_tilde)
        I = np.eye(self.dim_x)
        self.P = np.dot(np.dot(I - np.dot(K, self.H), self.P), (I - np.dot(K, self.H)).T) + np.dot(np.dot(K, self.R), K.T)

    def predict(self):
        """
        Advances the state vector and returns the predicted bounding box estimate.
        """
        if (self.x[6] + self.x[2]) <= 0:
            self.x[6] = 0.0

        self.x = np.dot(self.F, self.x)
        self.P = np.dot(np.dot(self.F, self.P), self.F.T) + self.Q

        self.age += 1
        if self.time_since_update > 0:
            self.hit_streak = 0
        self.time_since_update += 1
        self.history.append(self.get_state())
        return self.history[-1]

    def get_state(self):
        """
        Returns the current bounding box estimate in format [x1, y1, x2, y2].
        """
        x = self.x[0, 0]
        y = self.x[1, 0]
        a = max(0.01, self.x[2, 0])
        h = max(1.0, self.x[3, 0])
        w = a * h

        return np.array([x - w / 2.0, y - h / 2.0, x + w / 2.0, y + h / 2.0])
