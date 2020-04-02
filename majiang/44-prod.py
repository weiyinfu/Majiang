import numpy as np
from fractions import Fraction

a = np.array([Fraction(1, 3), Fraction(2, 5)])
print(np.prod(a))
print(np.sum(a))
print(float(Fraction(1, 3)))
