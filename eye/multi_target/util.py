import numpy as np
def expect(ntimes):
    return np.dot(np.arange(len(ntimes)), ntimes)


def show(dic):
    print(len(dic))
    for k, v in dic.items():
        print(k, v)

def check_param(a,target):
    assert np.all(a >= 0)
    for t in target:
        assert len(a) == len(t)
        assert np.all(a >= t) and np.all(t >= 0)