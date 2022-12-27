import pickle

of = open("../chips/net_6502.pkl", "rb")
obj = pickle.load(of)
pulled = obj['WIRE_PULLED']
print([i for i in range(len(pulled)) if pulled[i] == 1])
of.close()
